import json
from datetime import datetime
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from rate_limiter import check_rate_limit, check_ai_rate_limit, rate_limit_middleware
from timeout_middleware import timeout_middleware

from account_service import create_default_accounts
from accounting_service import compute_account_balances, compute_overview, create_journal_entry, summarize_entry
from ai_service import (
    format_currency_fa,
    parse_accounting_message,
    process_message,
)
from language_detect import detect_language
from ai_provider import is_configured as ai_is_configured
from auth import create_access_token, get_current_user, hash_password, verify_password
from conversation_service import (
    add_message,
    create_conversation as create_conversation_svc,
    delete_conversation as delete_conversation_svc,
    derive_title_from_message,
    get_conversation_messages as get_conversation_messages_svc,
    list_conversations as list_conversations_svc,
    verify_conversation_ownership,
    verify_user_owns_business,
)
from database import get_db
from financial_periods import parse_period, default_period
from models import (
    Account,
    Business,
    ChatConversation,
    ChatMessageRow,
    JournalEntry,
    User,
)
from report_service import (
    build_report_data,
    default_filename,
    export_report,
    resolve_report_key,
)
from schemas import (
    SUPPORTED_CURRENCIES,
    AccountResponse,
    AIAccountingAction,
    AuthResponse,
    BusinessContextResponse,
    BusinessContextUpdate,
    BusinessCreate,
    BusinessResponse,
    BusinessUpdate,
    ChatRequest,
    ConfirmRequest,
    ConversationMessageResponse,
    ConversationSummary,
    CurrentUserResponse,
    JournalEntryInput,
    LoginRequest,
    ProfileUpdate,
    ReportExportRequest,
    SignupRequest,
    SwitchBusinessRequest,
    TransactionResponse,
)
from validation_service import validate_accounting_action

app = FastAPI(title="RIVA AI API")

# Production middleware stack
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://192.168.1.38:3001",
        "https://riva-snowy-beta.vercel.app",
        "https://riva-app-inky.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add timeout middleware (before other middleware for proper timeout handling)
@app.middleware("http")
async def add_timeout_middleware(request: Request, call_next):
    return await timeout_middleware(request, call_next)

# Add rate limit headers to all responses
@app.middleware("http")
async def add_rate_limit_headers(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)


@app.get("/")
def root():
    return {"message": "RIVA AI API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _owned_business(db: Session, user: User, business_id: str | None) -> Business:
    business = db.query(Business).filter(Business.id == business_id).first() if business_id else None
    if not business or business.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


def _owned_conversation(db: Session, user: User, conversation_id: str) -> ChatConversation:
    conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    _owned_business(db, user, conversation.business_id)
    return conversation


def _verify_action_conversation(
    db: Session, user: User, business: Business, conversation_id: str | None
) -> None:
    """Ownership gate for /api/chat/resolve and /api/chat/confirm.

    If a conversation_id is supplied, it MUST belong to the authenticated
    business — otherwise we return 404 and never write a message anywhere.
    """
    if not conversation_id:
        return
    try:
        verify_conversation_ownership(db, conversation_id, business.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Conversation not found")


def _persist_message(
    db: Session,
    conversation_id: str,
    role: str,
    msg_type: str,
    content: str,
    action: dict | None = None,
) -> None:
    db.add(
        ChatMessageRow(
            conversation_id=conversation_id,
            role=role,
            msg_type=msg_type,
            content=content,
            action_json=json.dumps(action) if action is not None else None,
        )
    )


def _touch_conversation(db: Session, conversation: ChatConversation) -> None:
    conversation.updated_at = datetime.utcnow()
    db.commit()


def _get_or_create_conversation(
    db: Session, business: Business, conversation_id: str | None, seed_message: str
) -> ChatConversation:
    conversation = None
    if conversation_id:
        conversation = (
            db.query(ChatConversation)
            .filter(ChatConversation.id == conversation_id, ChatConversation.business_id == business.id)
            .first()
        )
    if conversation is None:
        title = seed_message.strip()[:60] or "New conversation"
        conversation = ChatConversation(business_id=business.id, title=title)
        db.add(conversation)
        db.flush()
    return conversation


def _business_response(business: Business, current_id: str) -> dict:
    return {
        "id": business.id,
        "name": business.name,
        "language": business.language,
        "base_currency": business.base_currency,
        "is_current": business.id == current_id,
    }


def _current_user_response(db: Session, user: User) -> dict:
    businesses = (
        db.query(Business)
        .filter(Business.owner_id == user.id)
        .order_by(Business.created_at)
        .all()
    )
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "business": {
            "id": user.business.id,
            "name": user.business.name,
            "language": user.business.language,
            "base_currency": user.business.base_currency,
        },
        "businesses": [_business_response(b, user.business_id) for b in businesses],
    }


def _auth_response(user: User) -> dict:
    """Serialize only safe user and business information for auth endpoints."""
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
        "business": {
            "id": user.business.id,
            "name": user.business.name,
            "language": user.business.language,
            "base_currency": user.business.base_currency,
        },
    }


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/api/auth/signup", response_model=AuthResponse, status_code=201)
def signup(request: Request, data: SignupRequest, db: Session = Depends(get_db)):
    # Rate limit: 3 signups per hour per IP (prevent abuse).
    # Sync rate-limit check — FastAPI runs sync `def` endpoints in a threadpool,
    # so the blocking in-memory limiter and DB/DB writes stay off the event loop.
    check_rate_limit(request, "auth_signup")
    email = str(data.email).lower()
    business_name = data.business_name.strip()

    if not business_name:
        raise HTTPException(status_code=422, detail="Business name cannot be empty")
    if data.base_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=422, detail=f"Unsupported currency: {data.base_currency}")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    try:
        business = Business(name=business_name, language="fa", base_currency=data.base_currency)
        db.add(business)
        db.flush()
        create_default_accounts(db=db, business=business)

        user = User(email=email, password_hash=hash_password(data.password), business_id=business.id)
        db.add(user)
        db.flush()

        business.owner_id = user.id

        db.commit()
        db.refresh(user)
        db.refresh(business)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    except Exception:
        db.rollback()
        raise

    return _auth_response(user)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    # Rate limit: 5 login attempts per 5 minutes (brute force protection)
    check_rate_limit(request, "auth_login")
    email = str(data.email).lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _auth_response(user)


@app.get("/api/auth/me", response_model=CurrentUserResponse)
def current_user(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _current_user_response(db, user)


@app.patch("/api/auth/me/profile", response_model=CurrentUserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.first_name = data.first_name.strip()
    user.last_name = data.last_name.strip()
    db.commit()
    db.refresh(user)
    return _current_user_response(db, user)


@app.post("/api/auth/switch-business", response_model=CurrentUserResponse)
def switch_business(
    data: SwitchBusinessRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, data.business_id)
    user.business_id = business.id
    db.commit()
    db.refresh(user)
    return _current_user_response(db, user)


# ---------------------------------------------------------------------------
# Businesses
# ---------------------------------------------------------------------------

@app.get("/api/businesses", response_model=list[BusinessResponse])
def list_businesses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    businesses = (
        db.query(Business).filter(Business.owner_id == user.id).order_by(Business.created_at).all()
    )
    return [_business_response(b, user.business_id) for b in businesses]


@app.post("/api/businesses", response_model=BusinessResponse, status_code=201)
def create_business(data: BusinessCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Business name cannot be empty")
    if data.base_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=422, detail=f"Unsupported currency: {data.base_currency}")

    business = Business(
        name=name,
        language=data.language,
        base_currency=data.base_currency,
        owner_id=user.id,
    )
    db.add(business)
    db.flush()

    create_default_accounts(db=db, business=business)

    # A newly created business becomes the active one — there's nothing
    # useful to look at in the one you just left.
    user.business_id = business.id

    db.commit()
    db.refresh(business)

    return _business_response(business, user.business_id)


@app.patch("/api/businesses/{business_id}", response_model=BusinessResponse)
def update_business(
    business_id: str,
    data: BusinessUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    business = _owned_business(db, user, business_id)

    # base_currency is intentionally absent from BusinessUpdate (and the
    # schema forbids extra fields) — it is locked forever at creation time.
    if data.name is not None:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=422, detail="Business name cannot be empty")
        business.name = name

    db.commit()
    db.refresh(business)
    return _business_response(business, user.business_id)


@app.get("/api/businesses/{business_id}/context", response_model=BusinessContextResponse)
def get_business_context(
    business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, business_id)
    return {"context": business.context_text}


@app.put("/api/businesses/{business_id}/context", response_model=BusinessContextResponse)
def update_business_context(
    business_id: str,
    data: BusinessContextUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    business = _owned_business(db, user, business_id)
    # This is background for the AI assistant only — it never creates or
    # validates a transaction by itself, so a generous length is fine and
    # there's nothing here for the accounting engine to be defended against.
    business.context_text = data.context.strip() or None
    db.commit()
    return {"context": business.context_text}


@app.delete("/api/businesses/{business_id}", status_code=204)
def delete_business(business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    business = _owned_business(db, user, business_id)

    remaining = db.query(Business).filter(Business.owner_id == user.id).count()
    if remaining <= 1:
        raise HTTPException(status_code=400, detail="You must keep at least one business.")

    was_current = business.id == user.business_id
    db.delete(business)
    db.flush()

    if was_current:
        fallback = (
            db.query(Business)
            .filter(Business.owner_id == user.id, Business.id != business_id)
            .order_by(Business.created_at)
            .first()
        )
        if fallback:
            user.business_id = fallback.id

    db.commit()
    return None


@app.get("/api/businesses/{business_id}/accounts", response_model=list[AccountResponse])
def get_business_accounts(
    business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, business_id)
    accounts = (
        db.query(Account)
        .filter(Account.business_id == business.id)
        .order_by(Account.code)
        .all()
    )
    balances = compute_account_balances(db, business.id)

    return [
        AccountResponse(
            id=account.id,
            code=account.code,
            name=account.name,
            account_type=account.account_type,
            balance=balances.get(account.id, Decimal("0")),
        )
        for account in accounts
    ]


@app.get("/api/businesses/{business_id}/transactions", response_model=list[TransactionResponse])
def get_business_transactions(
    business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, business_id)

    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.business_id == business.id)
        .order_by(JournalEntry.transaction_date.desc())
        .all()
    )

    transactions = []
    for entry in entries:
        if not entry.lines:
            continue

        summary = summarize_entry(entry)

        transactions.append(
            {
                "id": entry.id,
                "description": entry.description,
                "category": summary["category"],
                "date": entry.transaction_date.isoformat(),
                "amount": summary["amount"],
                "currency": entry.currency,
                "status": "posted",
            }
        )

    return transactions


@app.get("/api/businesses/{business_id}/overview")
def get_business_overview(
    business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, business_id)
    overview = compute_overview(db, business.id)

    return {
        "balance": str(overview["balance"]),
        "revenue": str(overview["revenue"]),
        "expenses": str(overview["expenses"]),
        "cash_flow": str(overview["cash_flow"]),
        "currency": business.base_currency,
        "recent_transactions": overview["recent_transactions"],
    }


# ---------------------------------------------------------------------------
# AI Assistant conversations
# ---------------------------------------------------------------------------

@app.get("/api/businesses/{business_id}/conversations", response_model=list[ConversationSummary])
def list_conversations(
    business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, business_id)
    return list_conversations_svc(db, business.id)


@app.post("/api/businesses/{business_id}/conversations", response_model=ConversationSummary, status_code=201)
def create_conversation(
    business_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Create a brand-new, empty conversation.

    This is what "New Chat" calls. It always creates a fresh conversation
    with a unique ID — never reuses or mixes with an existing one.
    """
    business = _owned_business(db, user, business_id)
    return create_conversation_svc(db, business.id)


@app.get("/api/conversations/{conversation_id}/messages", response_model=list[ConversationMessageResponse])
def get_conversation_messages(
    conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    _owned_conversation(db, user, conversation_id)
    return get_conversation_messages_svc(db, conversation_id)


@app.delete("/api/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    conversation = _owned_conversation(db, user, conversation_id)
    db.delete(conversation)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Journal entries (manual)
# ---------------------------------------------------------------------------

@app.post("/api/journal-entries")
def create_journal_entry_endpoint(
    data: JournalEntryInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    business = _owned_business(db, user, data.business_id)
    # No conversion, no independent per-transaction currency — every entry
    # is always recorded in the business's own locked base currency,
    # regardless of what the caller sent.
    data.currency = business.base_currency

    try:
        entry = create_journal_entry(db=db, data=data, business_base_currency=business.base_currency)
        return {
            "id": entry.id,
            "description": entry.description,
            "currency": entry.currency,
            "message": "Journal entry created successfully",
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


# ---------------------------------------------------------------------------
# AI Assistant chat
# ---------------------------------------------------------------------------

@app.post("/api/chat")
def chat(
    request: Request,
    data: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # AI rate limiting: prevent cost explosion and spam
    # Burst: 5 requests per 10 seconds; Sustained: 30 requests per minute.
    # Sync check: the endpoint body is blocking (DB + AI provider call), so it
    # must stay a sync `def` to run on FastAPI's threadpool — an async def here
    # would block the event loop and serialize all concurrent chat requests.
    check_ai_rate_limit(request, user.id)

    business = _owned_business(db, user, data.business_id)

    # Resolve the target conversation with ownership enforcement:
    # - If conversation_id is provided, it MUST belong to this business.
    # - If not provided (New Chat), a fresh conversation is created lazily.
    conversation = None
    if data.conversation_id:
        try:
            conversation = verify_conversation_ownership(db, data.conversation_id, business.id)
        except ValueError:
            raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation is None:
        title = None  # will be auto-titled from first user message
        conversation = ChatConversation(business_id=business.id, title=title)
        db.add(conversation)
        db.flush()

    # Run the AI orchestration BEFORE persisting the user message, so
    # get_recent_messages (which powers multi-turn memory) only sees prior
    # turns — the current user message is supplied as the prompt itself.
    response = process_message(data.message, business, db, conversation_id=conversation.id)

    # Persist the user message for every path.
    _persist_message(db, conversation.id, "user", "text", data.message)

    # A confirmation_required from the tool path carries `transactions` —
    # resolved previews ready for the user to confirm. Persist as a single
    # confirmation-required message whose action holds the preview list.
    if response.get("type") == "confirmation_required" and response.get("transactions"):
        action_payload = {
            "transactions": response["transactions"],
            "preview": response.get("message", ""),
        }
        add_message(
            db, conversation.id, "assistant", "confirmation_required",
            response.get("message", ""), action_payload,
        )
        _touch_conversation(db, conversation)
        if not conversation.title:
            conversation.title = derive_title_from_message(data.message)
        db.commit()
        return response

    # Legacy transaction path (Persian amount classification) — kept intact.
    if response.get("type") == "transaction":
        db.commit()
        return _handle_transaction_route(db, conversation, business, data.message)

    # Otherwise persist the assistant response as before.
    response_type = response.get("type", "answer")
    if response_type == "answer":
        add_message(db, conversation.id, "assistant", "answer", response["message"])
    elif response_type == "error":
        add_message(db, conversation.id, "assistant", "error", response["message"])
    else:
        add_message(db, conversation.id, "assistant", response_type, response.get("message", ""))

    # Update conversation title from first user message if no title yet
    if not conversation.title:
        conversation.title = derive_title_from_message(data.message)
        db.commit()

    return {**response, "conversation_id": conversation.id}


def _handle_transaction_route(
    db: Session,
    conversation: ChatConversation,
    business: Business,
    message: str,
) -> dict:
    """Existing AI accounting-action confirmation flow (unchanged behavior)."""
    accounts = (
        db.query(Account)
        .filter(Account.business_id == business.id)
        .order_by(Account.code)
        .all()
    )

    accounts_for_ai = [
        {"id": account.id, "name": account.name, "type": account.account_type, "code": account.code}
        for account in accounts
    ]

    try:
        action = parse_accounting_message(
            message=message,
            accounts=accounts_for_ai,
            business_currency=business.base_currency,
            business_context=business.context_text,
        )

        action.currency = business.base_currency

        missing = []
        if not action.amount:
            missing.append("مبلغ تراکنش")
        if not action.debit_account_id:
            missing.append("حساب مناسب برای خرید یا هزینه")

        if not missing and not action.credit_account_id:
            message = "این تراکنش از کدوم حساب پرداخت/دریافت بشه؟"
            _persist_message(
                db, conversation.id, "assistant", "missing_information", message, action.model_dump(mode="json")
            )
            _touch_conversation(db, conversation)
            return {
                "type": "missing_information",
                "message": message,
                "action": action,
                "choices": ["نقد", "بانک"],
                "conversation_id": conversation.id,
            }

        if missing:
            message = "برای آماده‌سازی پیش‌نمایش تراکنش، لطفاً " + " و ".join(missing) + " را مشخص کنید."
            _persist_message(
                db, conversation.id, "assistant", "missing_information", message, action.model_dump(mode="json")
            )
            _touch_conversation(db, conversation)
            return {
                "type": "missing_information",
                "message": message,
                "action": action,
                "conversation_id": conversation.id,
            }

        validate_accounting_action(db=db, business_id=business.id, action=action)

        debit_account = db.query(Account).filter(Account.id == action.debit_account_id).first()
        credit_account = db.query(Account).filter(Account.id == action.credit_account_id).first()

        message = (
            f"{action.description}\n"
            f"مبلغ: {format_currency_fa(action.amount, action.currency)}\n"
            f"حساب: {debit_account.name}\n"
            f"از: {credit_account.name}\n\n"
            f"این تراکنش ثبت شود؟"
        )

        # Enrich action dict with labels so the TransactionCard renders
        # correctly after page refresh (it reads these from the persisted JSON).
        action_dict = action.model_dump(mode="json")
        action_dict["debit_account_label"] = debit_account.name if debit_account else None
        action_dict["credit_account_label"] = credit_account.name if credit_account else None
        action_dict["category"] = debit_account.name if debit_account else None

        _persist_message(
            db, conversation.id, "assistant", "confirmation_required", message, action_dict
        )
        _touch_conversation(db, conversation)

        return {
            "type": "confirmation_required",
            "message": message,
            "action": action,
            "conversation_id": conversation.id,
        }

    except ValueError as error:
        _persist_message(db, conversation.id, "assistant", "error", str(error))
        _touch_conversation(db, conversation)
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(error)}")


@app.post("/api/chat/resolve")
def resolve_chat_choice(data: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    business = _owned_business(db, user, data.get("business_id"))

    # Enforce conversation ownership before writing any message.
    conversation_id = data.get("conversation_id")
    _verify_action_conversation(db, user, business, conversation_id)

    action_data = data.get("action")
    choice = (data.get("choice") or "").strip().lower()

    if not action_data:
        raise HTTPException(status_code=400, detail="Action is missing.")

    action = AIAccountingAction(**action_data)
    action.currency = business.base_currency

    accounts = (
        db.query(Account)
        .filter(Account.business_id == business.id)
        .order_by(Account.code)
        .all()
    )

    selected_account = None

    if choice in {"بانک", "bank"}:
        bank_accounts = [
            account for account in accounts if "بانک" in account.name.lower() or "bank" in account.name.lower()
        ]
        if len(bank_accounts) == 1:
            selected_account = bank_accounts[0]

    elif choice in {"صندوق", "نقد", "نقدی", "cash", "cash box"}:
        cash_accounts = [
            account for account in accounts if "صندوق" in account.name.lower() or "cash" in account.name.lower()
        ]
        if len(cash_accounts) == 1:
            selected_account = cash_accounts[0]

    if not selected_account:
        message = "حساب پرداختی انتخاب‌شده پیدا نشد یا چند حساب مشابه وجود دارد."
        if conversation_id:
            _verify_action_conversation(db, user, business, conversation_id)
            _persist_message(db, conversation_id, "assistant", "error", message)
            db.commit()
        return {"type": "error", "message": message}

    action.credit_account_id = selected_account.id

    try:
        debit_account, credit_account = validate_accounting_action(
            db=db, business_id=business.id, action=action
        )

        message = (
            f"{action.description}\n"
            f"مبلغ: {format_currency_fa(action.amount, action.currency)}\n"
            f"حساب هزینه: {debit_account.name}\n"
            f"پرداخت از: {credit_account.name}\n\n"
            f"این تراکنش ثبت شود؟"
        )

        if conversation_id:
            _verify_action_conversation(db, user, business, conversation_id)
            action_dict = action.model_dump(mode="json")
            action_dict["debit_account_label"] = debit_account.name if debit_account else None
            action_dict["credit_account_label"] = credit_account.name if credit_account else None
            action_dict["category"] = debit_account.name if debit_account else None
            _persist_message(
                db, conversation_id, "assistant", "confirmation_required", message, action_dict
            )
            db.commit()

        return {"type": "confirmation_required", "message": message, "action": action, "conversation_id": conversation_id}

    except ValueError as error:
        if conversation_id:
            _verify_action_conversation(db, user, business, conversation_id)
            _persist_message(db, conversation_id, "assistant", "error", str(error))
            db.commit()
        raise HTTPException(status_code=400, detail=str(error))


@app.post("/api/chat/confirm")
def confirm_transaction(data: ConfirmRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    business = _owned_business(db, user, data.business_id)
    # Enforce conversation ownership before writing any message.
    _verify_action_conversation(db, user, business, data.conversation_id)

    # The confirmation must be tied to the exact pending action(s) this
    # business/conversation previewed — resolved again server-side against the
    # authenticated business's real chart of accounts (never LLM ids reused
    # across users/businesses).
    actions = data.transactions if data.transactions is not None else ([data.action] if data.action else [])
    if not actions:
        raise HTTPException(status_code=400, detail="No transactions to confirm.")

    try:
        created_ids = []
        for action_data in actions:
            action_data.currency = business.base_currency
            debit_account, credit_account = validate_accounting_action(
                db=db, business_id=business.id, action=action_data
            )

            journal_input = JournalEntryInput(
                business_id=business.id,
                description=action_data.description or "AI accounting transaction",
                currency=action_data.currency,
                lines=[
                    {
                        "account_id": debit_account.id,
                        "debit": action_data.amount,
                        "credit": 0,
                        "description": action_data.description,
                    },
                    {
                        "account_id": credit_account.id,
                        "debit": 0,
                        "credit": action_data.amount,
                        "description": action_data.description,
                    },
                ],
            )

            entry = create_journal_entry(db=db, data=journal_input, business_base_currency=business.base_currency)
            created_ids.append(str(entry.id))

        # Persist a success message in the conversation, in the user's language
        # (detected from the action description wording).
        sample_text = " ".join((a.description or "") for a in actions if a.description)
        language = detect_language(sample_text) if sample_text else "en"
        if len(created_ids) == 1:
            success_message = "Transaction recorded successfully." if language == "en" else "تراکنش با موفقیت ثبت شد."
        else:
            success_message = f"{len(created_ids)} transactions recorded successfully." if language == "en" else f"{len(created_ids)} تراکنش با موفقیت ثبت شد."

        if data.conversation_id:
            conversation = (
                db.query(ChatConversation).filter(ChatConversation.id == data.conversation_id).first()
            )
            if conversation:
                _persist_message(db, conversation.id, "assistant", "success", success_message)
                _touch_conversation(db, conversation)

        return {
            "success": True,
            "message": success_message,
            "transaction_ids": created_ids,
            "transaction_id": created_ids[0] if len(created_ids) == 1 else None,
        }

    except ValueError as error:
        if data.conversation_id:
            _verify_action_conversation(db, user, business, data.conversation_id)
            _persist_message(db, data.conversation_id, "assistant", "error", str(error))
            db.commit()
        raise HTTPException(status_code=400, detail=str(error))


# ---------------------------------------------------------------------------
# Report export
# ---------------------------------------------------------------------------

@app.post("/api/businesses/{business_id}/reports/export")
def export_business_report(
    business_id: str,
    data: ReportExportRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate and download a financial report (CSV / XLSX / PDF).

    Deterministic backend calculation only — the AI never computes these
    numbers. The authenticated user must own the business.
    """
    business = _owned_business(db, user, business_id)

    report_key = resolve_report_key(data.report)
    if not report_key:
        raise HTTPException(status_code=422, detail=f"Unknown report: {data.report}")

    fmt = (data.format or "pdf").lower()
    if fmt not in {"csv", "xlsx", "pdf"}:
        raise HTTPException(status_code=422, detail=f"Unsupported format: {fmt}")

    period = parse_period(data.period) if data.period else default_period()

    try:
        report_data = build_report_data(
            db=db,
            report_key=report_key,
            business_id=business.id,
            business_name=business.name,
            base_currency=business.base_currency,
            period=period,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    try:
        data_bytes, content_type = export_report(report_data, fmt)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    filename = default_filename(report_data, fmt)

    return Response(
        content=data_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/businesses/{business_id}/reports/export/{report_key}")
def export_business_report_get(
    business_id: str,
    report_key: str,
    period: str | None = None,
    format: str = "pdf",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """GET variant of report export — enables AI tool download links.

    Query params: period (natural-language string), format (csv/xlsx/pdf).
    """
    business = _owned_business(db, user, business_id)

    resolved_key = resolve_report_key(report_key)
    if not resolved_key:
        raise HTTPException(status_code=422, detail=f"Unknown report: {report_key}")

    fmt = (format or "pdf").lower()
    if fmt not in {"csv", "xlsx", "pdf"}:
        raise HTTPException(status_code=422, detail=f"Unsupported format: {fmt}")

    resolved_period = parse_period(period) if period else default_period()

    try:
        report_data = build_report_data(
            db=db,
            report_key=resolved_key,
            business_id=business.id,
            business_name=business.name,
            base_currency=business.base_currency,
            period=resolved_period,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    try:
        data_bytes, content_type = export_report(report_data, fmt)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    filename = default_filename(report_data, fmt)

    return Response(
        content=data_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
