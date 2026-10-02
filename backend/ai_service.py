"""AI Service — orchestrates RIVA AI's conversational financial intelligence.

This is the main orchestration layer. It:

1. Takes a user message + authenticated business context
2. Decides whether the user wants to record a transaction, ask a question,
   or get recommendations
3. For questions: uses tool-calling to retrieve the real financial data,
   interprets the results (never computes them), and returns a data-driven
   answer with amounts/currency/period
4. For transactions: extracts the accounting action, requests confirmation,
   and never records without explicit user confirmation (handled by the
   /api/chat/confirm endpoint)

The deterministic financial math lives in analytics_service; the provider
call lives in ai_provider; tool definitions/execution live in ai_tools.
This module only orchestrates.
"""

import json
import re
from decimal import Decimal, InvalidOperation

from dotenv import load_dotenv

from schemas import AIAccountingAction
from models import Business
from conversation_service import add_message, get_recent_messages
from financial_periods import parse_period, default_period
from financial_context import build_business_context
from ai_provider import (
    chat_completion,
    ProviderError,
    TimeoutError,
    RateLimitError,
    AuthenticationError,
    InvalidResponseError,
    ProviderNotConfiguredError,
)
from ai_tools import TOOL_DEFINITIONS, execute_tool
from language_detect import detect_language
from transaction_recorder import ResolvedEntry, preview_messages_for

load_dotenv()


# ---------------------------------------------------------------------------
# Legacy/Digit/Amount helpers (preserved for backward compatibility)
# ---------------------------------------------------------------------------

_DIGIT_TRANSLATION = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789",
)
_AMOUNT_PATTERN = re.compile(
    r"(?P<number>[0-9]+(?:\.[0-9]+)?)\s*"
    r"(?P<scale>هزار|میلیون|ميليون|مليون|میلیارد|ميليارد|مليار)?\s*"
    r"(?P<unit>تومان|تومن|ریال)"
)
_SCALE_MULTIPLIERS = {
    None: Decimal("1"),
    "هزار": Decimal("1000"),
    "میلیون": Decimal("1000000"),
    "ميليون": Decimal("1000000"),
    "مليون": Decimal("1000000"),
    "میلیارد": Decimal("1000000000"),
    "ميليارد": Decimal("1000000000"),
    "مليار": Decimal("1000000000"),
}
_PAYMENT_WORDS = ("پرداخت", "پرداختم", "پرداخت کردم", "دادم", "خرید", "خریدم", "قبض")
_CASH_PATTERN = re.compile(r"(?:cash|نقدی|نقد|صندوق)", re.IGNORECASE)
_BANK_PATTERN = re.compile(r"(?:bank|بانک)", re.IGNORECASE)
_INVENTORY_TERMS = ("inventory", "purchase", "purchases", "stock", "موجودی", "کالا", "خرید")

_QUESTION_MARKERS = (
    "?", "؟", "چقدر", "چند", "چیه", "چیست",
    "how much", "what is", "what was", "what's", "show me", "list my",
    "نشون بده", "نشان بده", "نمایش بده",
)
_BALANCE_TERMS = ("balance", "موجودی", "دارایی")
_REVENUE_TERMS = ("revenue", "sales", "income", "درآمد", "فروش")
_EXPENSE_TERMS = ("expense", "expenses", "هزینه", "هزینه‌ها", "هزینه ها")
_CASHFLOW_TERMS = ("cash flow", "cashflow", "جریان نقدی")
_CASH_TERMS = ("cash", "نقد", "نقدی", "صندوق", "نقدینگی")

_CURRENCY_LABELS_FA = {"IRR": "ریال", "TOMAN": "تومان", "USD": "دلار", "EUR": "یورو", "GBP": "پوند"}


def _contains_any(haystack: str, terms: tuple[str, ...]) -> bool:
    lowered = haystack.casefold()
    return any(term in lowered or term in haystack for term in terms)


def format_currency_fa(amount, currency: str) -> str:
    label = _CURRENCY_LABELS_FA.get(currency, currency)
    return f"{amount:,} {label}"


def normalize_digits(text: str) -> str:
    """Convert Persian and Arabic-Indic digits to ASCII digits."""
    return text.translate(_DIGIT_TRANSLATION)


def normalize_amount(message: str, business_currency: str) -> tuple[Decimal, str] | None:
    """Extract a Persian monetary amount and normalize it into the business's own
    ledger unit.

    Toman and Rial are the same real-world currency at a fixed, exact 10:1
    ratio (never a market rate) — so converting between them when the user's
    wording doesn't match the business's own ledger unit is not "currency
    conversion" in the FX sense; it's the same kind of exact unit scaling as
    cents vs. dollars, and it's what lets a business ledgered in Rial keep
    working correctly even though Iranians almost always *speak* in Toman.
    A business whose base currency actually IS Toman needs no scaling at all.
    """
    normalized = normalize_digits(message)
    normalized = re.sub(r"(?<=\d)[,،](?=\d)", "", normalized)
    match = _AMOUNT_PATTERN.search(normalized)
    if not match:
        return None

    try:
        amount = Decimal(match.group("number")) * _SCALE_MULTIPLIERS[match.group("scale")]
    except (InvalidOperation, KeyError):
        return None

    spoken_unit = "TOMAN" if match.group("unit") in {"تومان", "تومن"} else "IRR"
    result_currency = business_currency

    if business_currency == "TOMAN" and spoken_unit == "IRR":
        amount /= Decimal("10")
    elif business_currency == "IRR" and spoken_unit == "TOMAN":
        amount *= Decimal("10")
    elif business_currency not in {"IRR", "TOMAN"}:
        result_currency = spoken_unit

    if amount != amount.to_integral_value():
        return None
    return amount.to_integral_value(), result_currency


def _account_name(account: dict) -> str:
    return str(account.get("name", "")).casefold()


def _account_by_payment_method(message: str, accounts: list[dict]) -> str | None:
    pattern = _CASH_PATTERN if _CASH_PATTERN.search(message) else _BANK_PATTERN if _BANK_PATTERN.search(message) else None
    if pattern is None:
        return None
    names = ("cash", "صندوق", "نقد") if pattern is _CASH_PATTERN else ("bank", "بانک")
    matches = [account for account in accounts if any(name in _account_name(account) for name in names)]
    return matches[0]["id"] if len(matches) == 1 else None


def _inventory_purchase_accounts(accounts: list[dict]) -> list[dict]:
    return [account for account in accounts if any(term in _account_name(account) for term in _INVENTORY_TERMS)]


def _professional_description(message: str, fallback: str | None) -> str | None:
    normalized = re.sub(r"\s+", " ", message).strip()
    purchase_match = re.search(r"(?:برای|جهت)\s+(.+)", normalized)
    description = purchase_match.group(1) if purchase_match else (fallback or normalized)
    description = re.sub(r"\s+(?:دادم|پرداخت کردم|پرداختم)$", "", description).strip(" .،")
    return description or fallback


def normalize_accounting_action(
    message: str,
    action: AIAccountingAction,
    accounts: list[dict],
    business_currency: str,
) -> AIAccountingAction:
    """Apply deterministic amount conversion and conservative account safeguards."""
    account_ids = {str(account["id"]) for account in accounts}
    normalized_amount = normalize_amount(message, business_currency)

    if normalized_amount:
        action.amount, action.currency = normalized_amount

    if action.debit_account_id not in account_ids:
        action.debit_account_id = None
    if action.credit_account_id not in account_ids:
        action.credit_account_id = None

    is_purchase = "خرید" in message or "purchase" in message.casefold()
    if is_purchase:
        candidates = _inventory_purchase_accounts(accounts)
        if len(candidates) == 1:
            action.debit_account_id = candidates[0]["id"]
        elif not candidates or action.debit_account_id not in {candidate["id"] for candidate in candidates}:
            action.debit_account_id = None
        action.intent = "purchase_payment"

    if any(word in message.casefold() for word in _PAYMENT_WORDS):
        action.credit_account_id = _account_by_payment_method(message, accounts)

    action.description = _professional_description(message, action.description)
    return action


def parse_accounting_message(
    message: str, accounts: list[dict], business_currency: str, business_context: str | None = None
) -> AIAccountingAction:
    """Use the AI provider to extract an accounting action from a message."""
    accounts_text = json.dumps(accounts, ensure_ascii=False)
    context_block = (
        f"\nBusiness context (background only — never invent an account or bypass validation because of this):\n{business_context}\n"
        if business_context
        else ""
    )

    system_prompt = f"""
You are RIVA AI's accounting interpretation engine.

Return ONLY valid JSON. No markdown. No explanation.

The JSON must have exactly these fields:
- intent: string
- amount: number or null
- currency: string or null
- description: string or null
- debit_account_id: string or null
- credit_account_id: string or null

Available accounts:
{accounts_text}
{context_block}
Rules:
1. Never invent an account ID. Use only IDs from Available accounts.
2. Extract the amount and currency exactly as written by the user.
3. Python will perform Toman/Rial unit normalization for this business's own currency. Do not convert currencies yourself.
4. For تومان/تومن, preserve the numeric amount exactly as written.
5. For ریال, preserve the numeric amount exactly as written.
6. If the debit account is uncertain, use null.
7. Never use "Other Expenses" as a fallback for inventory or product purchases.
8. Credit Cash only when cash/naghdi/sandoogh is explicitly mentioned.
9. Credit Bank only when bank/bank account is explicitly mentioned.
10. Never infer the payment source from "I paid" / "پرداخت کردم".
11. For a product purchase, use an inventory/purchases account only when one clearly exists.
12. Keep the Persian description concise and natural.
13. Business context (if provided above) may help you pick a more sensible account or intent (e.g. a purchase that matches the business's known inventory), but never lets you invent an account ID or skip any other rule.
"""

    response = chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        max_tokens=1000,
        temperature=0.1,
    )

    content = response.get("content")
    if not content:
        raise ValueError("AI returned an empty response.")

    content = _sanitize_model_text(content)

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON.") from error

    try:
        action = AIAccountingAction.model_validate(parsed)
    except Exception as error:
        raise ValueError("AI returned an invalid accounting action.") from error

    return normalize_accounting_action(
        message,
        action,
        accounts,
        business_currency,
    )


# ---------------------------------------------------------------------------
# New tool-calling question path
# ---------------------------------------------------------------------------

def _build_system_prompt(business, context_prompt: str, language: str = "en") -> str:
    lang_rule = (
        "ALWAYS respond in Persian (Farsi) — the user is writing in Persian. "
        "Keep account names and currency labels as they are (RIVA accounts are "
        "stored in English; present them clearly alongside their Persian context)."
        if language == "fa"
        else "ALWAYS respond in English — the user is writing in English."
    )
    return (
        f"You are RIVA AI, a financial intelligence assistant for the business "
        f"'{business.name}' (base currency: {business.base_currency}).\n\n"
        f"Business context:\n{context_prompt}\n\n"
        "You answer questions about this business's real financial data.\n"
        "CRITICAL RULES:\n"
        "0. LANGUAGE: Match the user's language for EVERY response. "
        f"{lang_rule} "
        "Do not switch language mid-conversation because of the business locale.\n"
        "1. NEVER invent or guess financial figures. Always call the appropriate tool to retrieve real data.\n"
        "2. When reporting numbers, ALWAYS include: amount, currency, and the period.\n"
        "3. If the user asks about a period, call tools with the period wording (the backend resolves it deterministically).\n"
        "4. If you need both financial analytics and specific data, make multiple tool calls.\n"
        "5. Use the actual tool results to answer; never estimate.\n"
        "6. If a tool returns no data, say clearly that no data exists for that scope — do not fabricate.\n"
        "7. Recommendations must cite the underlying metric and period.\n"
        "8. When the user ASKS to record income/expense/transactions, call the "
        "record_transactions tool with the account ids resolved from the "
        "business context. If an id is missing, still call the tool; RIVA will "
        "ask the user for what's missing and confirm before saving.\n"
        "9. Be concise but complete.\n"
    )


_MARKDOWN_FENCE_RE = re.compile(r"```[a-zA-Z0-9_+.-]*\s*\n?", re.MULTILINE)
_TRAILING_FENCE_RE = re.compile(r"\n?```\s*$")
_SVG_BLOCK_RE = re.compile(r"<svg[^>]*>.*?</svg>", re.DOTALL | re.IGNORECASE)
_MULTILINE_RE = re.compile(r"\n{3,}")


def _sanitize_model_text(text: str) -> str:
    """Clean model free-text for the plain-text chat UI.

    - Removes markdown code-fence markers (```svg, ```python, ...) so the
      literal backticks never appear to the user.
    - Removes any raw <svg>...</svg> blocks the model may have produced as
      decoration — the UI has no markup renderer, so showing the raw tag text
      would leak "svg" into the conversation.
    - Collapses excessive blank lines.
    """
    if not text:
        return text or ""
    cleaned = _MARKDOWN_FENCE_RE.sub("", text)
    cleaned = _TRAILING_FENCE_RE.sub("", cleaned)
    cleaned = _SVG_BLOCK_RE.sub("", cleaned)
    cleaned = _MULTILINE_RE.sub("\n\n", cleaned)
    return cleaned.strip()


def _provider_error_message(error: Exception) -> dict:
    """Map provider exceptions to a user-facing error response dict."""
    if isinstance(error, ProviderNotConfiguredError):
        return {
            "type": "error",
            "message": (
                "The AI provider is not configured on this server. "
                "Add an OPENAI_API_KEY (and optionally OPENAI_MODEL / OPENAI_BASE_URL) "
                "to backend/.env and restart the backend."
            ),
        }
    if isinstance(error, AuthenticationError):
        return {"type": "error", "message": "AI provider authentication failed. Please check the API key configuration."}
    if isinstance(error, RateLimitError):
        return {"type": "error", "message": "The AI provider is rate-limiting requests. Please try again in a moment."}
    if isinstance(error, TimeoutError):
        return {"type": "error", "message": "The AI provider timed out. Please try again."}
    if isinstance(error, InvalidResponseError):
        return {"type": "error", "message": "The AI provider returned an invalid response. Please try again."}
    if isinstance(error, ProviderError):
        return {"type": "error", "message": f"AI provider error: {str(error)}"}
    return {"type": "error", "message": f"AI processing failed: {str(error)}"}


_MAX_TOOL_ROUNDS = 3


def process_tool_question(
    message: str,
    business: Business,
    db,
    conversation_id: str | None = None,
    history: list[dict] | None = None,
) -> dict:
    """Process a financial question using AI tool calling and real data.

    Takes the current user message plus prior conversation context (the last
    few user/assistant turns) so the model can resolve references like "how
    much of *that* was marketing".

    Returns a dict with either:
      {"type": "answer", "message": str, "exports": [...]}
      {"type": "error", "message": str}
    """
    context = build_business_context(db, business)
    language = detect_language(message)
    system_prompt = _build_system_prompt(business, context.to_prompt(), language=language)

    conversation_messages: list[dict] = [{"role": "system", "content": system_prompt}]

    # Multi-turn memory — the last few resolved turns help the model
    # understand references to what was just discussed. Bounded, so the
    # prompt never grows without limit.
    for turn in history or []:
        if turn.get("content") is None:
            continue
        conversation_messages.append({
            "role": "user" if turn.get("role") == "user" else "assistant",
            "content": turn["content"],
        })

    conversation_messages.append({"role": "user", "content": message})

    exports: list[dict] = []
    pending_transactions: list[dict] | None = None
    detected_language = language  # reuse from caller

    try:
        response = chat_completion(
            messages=conversation_messages,
            tools=TOOL_DEFINITIONS,
            max_tokens=2000,
            temperature=0.2,
        )
    except (ProviderNotConfiguredError, AuthenticationError, RateLimitError,
            TimeoutError, InvalidResponseError, ProviderError) as error:
        return _provider_error_message(error)

    content = response.get("content")
    tool_calls = response.get("tool_calls")

    # Run up to _MAX_TOOL_ROUNDS of tool-calling. Each round executes the
    # requested tools and feeds results back to the model, until it answers.
    rounds = 0
    while tool_calls and rounds < _MAX_TOOL_ROUNDS:
        rounds += 1

        tool_results = []
        for tc in tool_calls:
            if not isinstance(tc, dict):
                continue
            fn = tc.get("function") if isinstance(tc.get("function"), dict) else {}
            tool_name = fn.get("name")
            raw_args = fn.get("arguments", "{}")

            try:
                arguments = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args or {})
            except json.JSONDecodeError:
                arguments = {}

            # Execute with the business context, NEVER with LLM-provided business_id
            result = execute_tool(
                tool_name=tool_name,
                arguments=arguments,
                db=db,
                business_id=business.id,
                business_name=business.name,
                base_currency=business.base_currency,
            )

            # Capture export metadata produced by the report tool.
            if isinstance(result, dict) and result.get("success") and result.get("export"):
                exports.append(result["export"])

            # Capture record_transactions — this returns the resolved
            # previews but does NOT record anything yet. The frontend will
            # show them; actual recording happens via /api/chat/confirm.
            if (tool_name == "record_transactions"
                and isinstance(result, dict)
                and result.get("success")
                and result.get("data", {}).get("transactions")):
                pending_transactions = result["data"]["transactions"]

            tool_results.append({
                "tool_call_id": tc.get("id"),
                "role": "tool",
                "name": tool_name,
                "content": json.dumps(result, ensure_ascii=False),
            })

        conversation_messages.append(
            {"role": "assistant", "content": content or "", "tool_calls": tool_calls}
        )
        conversation_messages.extend(tool_results)

        try:
            response = chat_completion(
                messages=conversation_messages,
                tools=TOOL_DEFINITIONS,
                max_tokens=2000,
                temperature=0.2,
            )
        except (ProviderNotConfiguredError, AuthenticationError, RateLimitError,
                TimeoutError, InvalidResponseError, ProviderError) as error:
            return _provider_error_message(error)

        content = response.get("content")
        tool_calls = response.get("tool_calls")

        # If record_transactions was called, stop looping and return the
        # previews immediately — the user must confirm each one.
        if pending_transactions:
            break

    if pending_transactions:
        lang = detected_language

        previews = []
        for txn in pending_transactions:
            amount_val = Decimal(txn["amount"]) if txn.get("amount") else Decimal("0")
            desc_val = txn.get("description") or "AI transaction"
            entry_type = txn.get("intent") or "expense"
            preview = preview_messages_for(
                ResolvedEntry(
                    intent=entry_type,
                    description=desc_val,
                    amount=amount_val,
                    currency=txn.get("currency", business.base_currency),
                    debit_account_id=txn.get("debit_account_id", ""),
                    credit_account_id=txn.get("credit_account_id", ""),
                    debit_account_name=txn.get("debit_account_label"),
                    credit_account_name=txn.get("credit_account_label"),
                ),
                lang,
            )
            previews.append(preview["preview"])

        confirm_msg = "\n\n".join(previews)
        if lang == "fa":
            confirm_msg += "\n\nآیا می‌خواهید این تراکنش‌ها را ثبت کنید؟"
        else:
            confirm_msg += "\n\nDo you want me to record these transactions?"

        return {
            "type": "confirmation_required",
            "message": confirm_msg,
            "transactions": pending_transactions,
            "conversation_id": conversation_id,
        }

    if tool_calls:
        # We exhausted the tool-call budget without a final answer.
        return {
            "type": "error",
            "message": "The AI could not finish analyzing your request. Please try again.",
        }

    if content:
        return {"type": "answer", "message": _sanitize_model_text(content), "exports": exports}

    # Tool calls were exhausted but no usable text came back.
    return {"type": "error", "message": "The AI returned an empty response. Please try again."}


# ---------------------------------------------------------------------------
# Main chat orchestration
# ---------------------------------------------------------------------------

_AMOUNT_IN_WORDS = re.compile(
    r"\b\d+(?:[.,]\d+)?\s*(?:dollars?|usd|us\$|€|eur|euros?|£|gbp|tomans?|toman|rials?|rial)|\b\d+(?:[.,]\d+)?\s*\$|\$\s*\d+(?:[.,]\d+)?",
    re.IGNORECASE,
)
_INCOME_VERBS = ("earned", "received", "got", "made", "sold", "income", "revenue", "sales")
_EXPENSE_VERBS = ("spent", "paid", "bought", "purchased", "expense", "bill", "cost", "rent", "fee")
_EN_TRANSACTION_HINTS = (
    "for electric", "for rent", "for marketing", "for supplies", "for salary",
    "electric bill", "paid ", "spent ", "earned ", "received ", "bought ", "purchased ",
)


def _en_amount_present(message: str) -> bool:
    return bool(_AMOUNT_IN_WORDS.search(message))


def classify_message(message: str) -> str:
    """Classify a message as 'question' or 'transaction'.

    Handles both Persian amounts (tomans/rials) and English currency amounts
    ($/dollars/eur/...). A message that describes an inflow/outflow with a
    concrete amount is a transaction request; anything else is a question.
    """
    text = message.casefold().strip()
    has_amount = bool(normalize_amount(message, "IRR") or normalize_amount(message, "TOMAN"))
    has_en_amount = _en_amount_present(text)
    has_any_amount = has_amount or has_en_amount

    has_marker = _contains_any(message, _QUESTION_MARKERS)

    is_income = any(v in text for v in _INCOME_VERBS)
    is_expense = any(v in text for v in _EXPENSE_VERBS)
    has_action_hint = is_income or is_expense or any(h in text for h in _EN_TRANSACTION_HINTS)

    if has_marker and not has_any_amount:
        return "question"

    if has_any_amount and not has_marker:
        return "transaction"

    if has_marker and has_any_amount:
        # "how much did we earn" → question even with amount-like words
        if _contains_any(message, _BALANCE_TERMS + _REVENUE_TERMS + _EXPENSE_TERMS + _CASHFLOW_TERMS + _CASH_TERMS) and not has_action_hint:
            return "question"
        return "transaction"

    # No amount: only a transaction when the user clearly states one
    if has_action_hint and _contains_any(message, _PAYMENT_WORDS):
        return "transaction"

    return "question"


def process_message(
    message: str,
    business: Business,
    db,
    conversation_id: str | None = None,
) -> dict:
    """Main entry point for processing a chat message.

    Returns a response that the caller persists and returns to the client.

    Every message — question OR transaction request — flows through the
    tool-calling path, which now includes the record_transactions tool. The
    legacy Persian-only "transaction" classification is preserved so the route
    layer can still fall back to _handle_transaction_route for Persian wording
    where direct account resolution is preferred.
    """
    classification = classify_message(message)

    # Build multi-turn history for the question path
    history = []
    if conversation_id:
        history = get_recent_messages(db, conversation_id, limit=12)

    # Persian transaction requests use the classic parse path (existing
    # flow, hardened, currency-aware). English / mixed messages go through
    # the tool-calling path so the model calls record_transactions.
    if classification == "transaction" and detect_language(message) == "fa":
        return {"type": "transaction", "message": "transaction"}

    # Question OR (English) transaction — tool-calling path.
    return process_tool_question(message, business, db, conversation_id=conversation_id, history=history)