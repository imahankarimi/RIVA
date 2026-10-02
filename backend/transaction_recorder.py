"""Deterministic transaction preview & recording for the AI assistant.

This is the single place that turns an AI-intended transaction (income or
expense) into a **validated double-entry journal preview** using the
business's REAL chart of accounts. It never fabricates account ids.

Flows that use this:
- AI tool `record_transactions` (preview → confirmation_required)
- `/api/chat/confirm` (execute the preview via the existing accounting service)

The actual journal entry is always created by `accounting_service.create_journal_entry`
— the real double-entry engine. This module only resolves accounts and builds
the balanced line set; it never writes directly.
"""

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.orm import Session

from models import Account, Business
from schemas import JournalEntryInput, JournalLineInput


@dataclass
class ResolvedEntry:
    intent: str  # "income" | "expense"
    description: str
    amount: Decimal
    currency: str
    debit_account_id: str
    credit_account_id: str
    debit_account_name: str | None = None
    credit_account_name: str | None = None
    missing: list[str] | None = None
    error: str | None = None

    def to_action_dict(self) -> dict:
        return {
            "intent": self.intent,
            "amount": str(self.amount) if self.amount is not None else None,
            "currency": self.currency,
            "description": self.description,
            "debit_account_id": self.debit_account_id,
            "credit_account_id": self.credit_account_id,
            "debit_account_label": self.debit_account_name,
            "credit_account_label": self.credit_account_name,
            "category": self.debit_account_name or self.credit_account_name,
        }


def _candidates(business_id: str, db: Session, account_type: str) -> list[Account]:
    return (
        db.query(Account)
        .filter(Account.business_id == business_id, Account.account_type == account_type)
        .order_by(Account.code)
        .all()
    )


def _match_name(accounts: list[Account], keywords: tuple[str, ...]) -> Account | None:
    exact = [a for a in accounts if any(k in a.name.casefold() for k in keywords)]
    return exact[0] if len(exact) == 1 else None


def _resolve_expense(business_id, db, description) -> tuple[str | None, str | None, list[str]]:
    """Resolve the debit (expense) + credit (payment source) accounts."""
    expense_accounts = _candidates(business_id, db, "expense")
    asset_accounts = _candidates(business_id, db, "asset")

    desc = (description or "").casefold()

    # Payment source detection first (from description / intent).
    credit = None
    if any(k in desc for k in ("cash", "صندوق")):
        credit = _match_name(asset_accounts, ("cash", "صندوق", "نقد"))
    elif any(k in desc for k in ("bank", "بانک")):
        credit = _match_name(asset_accounts, ("bank", "بانک"))
    else:
        # Sensible default: paid from Cash (fall back to Bank).
        credit = _match_name(asset_accounts, ("cash", "صندوق", "نقد")) or _match_name(asset_accounts, ("bank", "بانک"))

    # Expense category
    debit = None
    direct = {
        "rent": "rent",
        "electric": "utilities",
        "electricity": "utilities",
        "utility": "utilities",
        "utilities": "utilities",
        "water": "utilities",
        "gas": "utilities",
        "marketing": "marketing",
        "advert": "marketing",
        "ads": "marketing",
        "salary": "salary",
        "wage": "salary",
        "wages": "salary",
        "supplies": "supplies",
        "office": "supplies",
        "software": "software",
        "phone": "telecom",
        "internet": "telecom",
        "travel": "travel",
    }
    for keyword, bucket in direct.items():
        if keyword in desc:
            debit = _match_name(expense_accounts, (bucket,))
            if debit:
                break

    missing = []
    if not debit:
        missing.append("expense account")
    if not credit:
        missing.append("payment source account")
    return (debit.id if debit else None, credit.id if credit else None, missing)


def _resolve_income(business_id, db, description) -> tuple[str | None, str | None, list[str]]:
    """Resolve the debit (bank/cash) + credit (revenue) accounts.

    Defaults:
    - Debit (where the money lands): Bank if it exists, else Cash.
    - Credit (the revenue stream): the main sales revenue account.
    When a description explicitly names bank/cash, that takes precedence.
    """
    revenue_accounts = _candidates(business_id, db, "revenue")
    asset_accounts = _candidates(business_id, db, "asset")

    desc = (description or "").casefold()

    debit = None
    if any(k in desc for k in ("bank", "بانک")):
        debit = _match_name(asset_accounts, ("bank", "بانک"))
    elif any(k in desc for k in ("cash", "صندوق", "نقد")):
        debit = _match_name(asset_accounts, ("cash", "صندوق", "نقد"))
    else:
        # Sensible default: deposit into Bank (fall back to Cash).
        debit = _match_name(asset_accounts, ("bank", "بانک")) or _match_name(asset_accounts, ("cash", "صندوق", "نقد"))
    # Default income goes to the main sales revenue account
    credit = _match_name(revenue_accounts, ("sales", "revenue", "فروش", "درآمد"))

    missing = []
    if not debit:
        missing.append("receiving account")
    if not credit:
        missing.append("revenue account")
    return (debit.id if debit else None, credit.id if credit else None, missing)


def resolve_action(
    db: Session,
    business_id: str,
    base_currency: str,
    intent: str,
    amount: Decimal,
    description: str,
    debit_account_id: str | None = None,
    credit_account_id: str | None = None,
) -> ResolvedEntry:
    """Resolve an intended transaction into a validated, real-account preview."""
    if amount is None or amount <= 0:
        return ResolvedEntry(
            intent=intent, description=description or "", amount=amount,
            currency=base_currency,
            debit_account_id="", credit_account_id="",
            error="A valid amount greater than zero is required.",
        )

    if intent == "expense":
        debit, credit, missing = _resolve_expense(business_id, db, description)
    elif intent == "income":
        debit, credit, missing = _resolve_income(business_id, db, description)
    else:
        return ResolvedEntry(
            intent=intent, description=description or "", amount=amount,
            currency=base_currency,
            debit_account_id="", credit_account_id="",
            error=f"Unsupported intent: {intent}",
        )

    real_debit = debit or debit_account_id
    real_credit = credit or credit_account_id

    debit_account = db.query(Account).filter(
        Account.id == real_debit, Account.business_id == business_id
    ).first() if real_debit else None
    credit_account = db.query(Account).filter(
        Account.id == real_credit, Account.business_id == business_id
    ).first() if real_credit else None

    if not debit_account:
        missing.append("debit account")
    if not credit_account:
        missing.append("credit account")

    return ResolvedEntry(
        intent=intent,
        description=description or "",
        amount=amount,
        currency=base_currency,
        debit_account_id=debit_account.id if debit_account else "",
        credit_account_id=credit_account.id if credit_account else "",
        debit_account_name=debit_account.name if debit_account else None,
        credit_account_name=credit_account.name if credit_account else None,
        missing=missing or None,
    )


def build_journal_input(business_id: str, action: dict, base_currency: str) -> JournalEntryInput:
    """Build a JournalEntryInput from a resolved action dict."""
    debit = action["debit_account_id"]
    credit = action["credit_account_id"]
    amount = Decimal(str(action["amount"]))
    description = action.get("description") or "AI accounting transaction"
    return JournalEntryInput(
        business_id=business_id,
        description=description,
        currency=base_currency,
        lines=[
            JournalLineInput(account_id=debit, debit=amount, credit=Decimal("0"), description=description),
            JournalLineInput(account_id=credit, debit=Decimal("0"), credit=amount, description=description),
        ],
    )


def preview_messages_for(entry: ResolvedEntry, language: str) -> dict:
    """Human-readable preview + confirmation question in the user's language."""
    if language == "fa":
        preview = (
            f"{entry.description}\n"
            f"مبلغ: {entry.amount:,.0f} {entry.currency}\n"
            f"حساب بدهکار: {entry.debit_account_name or '—'}\n"
            f"حساب بستانکار: {entry.credit_account_name or '—'}\n\n"
            f"این تراکنش ثبت شود؟"
        )
        return {"preview": preview, "confirm_q": "این تراکنش ثبت شود؟"}
    preview = (
        f"{entry.description}\n"
        f"Amount: {entry.amount:,.2f} {entry.currency}\n"
        f"Debit account: {entry.debit_account_name or '—'}\n"
        f"Credit account: {entry.credit_account_name or '—'}\n\n"
        f"Record this transaction?"
    )
    return {"preview": preview, "confirm_q": "Record this transaction?"}