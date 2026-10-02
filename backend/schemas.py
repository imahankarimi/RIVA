from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


SUPPORTED_CURRENCIES = ("IRR", "TOMAN", "USD", "EUR", "GBP")


class JournalLineInput(BaseModel):
    account_id: str
    debit: Decimal = Field(default=Decimal("0"), ge=0)
    credit: Decimal = Field(default=Decimal("0"), ge=0)
    description: str | None = None


class JournalEntryInput(BaseModel):
    business_id: str
    description: str
    currency: str = "IRR"
    lines: list[JournalLineInput]


class BusinessCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    language: str = "fa"
    # Required — a business's base currency is chosen once, at creation,
    # and can never change afterwards. No default: the caller must decide.
    base_currency: str


class BusinessUpdate(BaseModel):
    # extra="forbid" makes any attempt to send base_currency (or anything
    # else) fail validation with a 422, rather than silently ignoring it —
    # the currency lock is enforced here, not just left unimplemented.
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=255)


class BusinessContextUpdate(BaseModel):
    # A separate, narrow endpoint/schema for this — deliberately not part of
    # BusinessUpdate, which stays locked down to name-only.
    context: str = Field(default="", max_length=4000)


class BusinessContextResponse(BaseModel):
    context: str | None = None


class BusinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    language: str
    base_currency: str
    is_current: bool = False


class SwitchBusinessRequest(BaseModel):
    business_id: str


class AccountResponse(BaseModel):
    id: str
    code: str | None
    name: str
    account_type: str
    balance: Decimal = Decimal("0")


class ChatRequest(BaseModel):
    business_id: str
    message: str
    conversation_id: str | None = None


class AccountingPreview(BaseModel):
    intent: str
    amount: Decimal | None = None
    currency: str | None = None
    description: str | None = None
    debit_account_id: str | None = None
    credit_account_id: str | None = None


class ChatResponse(BaseModel):
    type: str
    message: str
    action: AccountingPreview | None = None
    choices: list[str] | None = None
    conversation_id: str | None = None


class ReportExportRequest(BaseModel):
    """Request to export a financial report.

    report: report key (profit_loss, cash_flow, expense_report,
            transaction_report, balance_sheet, trial_balance)
    business_id: authenticated business
    period: natural-language period ('last month', 'this year', ...)
    format: 'csv' | 'xlsx' | 'pdf'
    """
    business_id: str
    report: str
    period: str | None = None
    format: str = "pdf"


class ConfirmRequest(BaseModel):
    business_id: str
    action: AccountingPreview | None = None
    transactions: list[AccountingPreview] | None = None
    conversation_id: str | None = None


class AIAccountingAction(BaseModel):
    intent: str
    amount: Decimal | None = None
    currency: str | None = None
    description: str | None = None
    debit_account_id: str | None = None
    credit_account_id: str | None = None


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    business_name: str = Field(min_length=1, max_length=255)
    base_currency: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)


class AuthUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None


class AuthBusinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    language: str
    base_currency: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
    business: AuthBusinessResponse


class CurrentUserResponse(AuthUserResponse):
    business: AuthBusinessResponse
    businesses: list[BusinessResponse] = []


class TransactionResponse(BaseModel):
    id: str
    description: str
    category: str
    date: str
    amount: Decimal
    currency: str
    status: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    updated_at: datetime


class ConversationMessageResponse(BaseModel):
    id: str
    role: str
    msg_type: str
    content: str
    action: dict | None = None
    created_at: datetime
