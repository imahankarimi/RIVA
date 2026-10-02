import hashlib
from decimal import Decimal
import sqlalchemy as sa

from sqlalchemy.orm import Session

from models import Account, JournalEntry, JournalLine
from schemas import JournalEntryInput, SUPPORTED_CURRENCIES

SUPPORTED_CURRENCIES = set(SUPPORTED_CURRENCIES)

# Account types that increase on the debit side; the rest (liability,
# equity, revenue) increase on the credit side.
_DEBIT_NORMAL_TYPES = {"asset", "expense"}


def create_journal_entry(
    db: Session,
    data: JournalEntryInput,
    business_base_currency: str,
) -> JournalEntry:
    """Create a journal entry with full ACID guarantees.

    CRITICAL PRODUCTION SAFETY:
    - Serializes concurrent writes with a per-business advisory lock
      (prevents write skew / lost balance updates)
    - Validates double-entry balance BEFORE commit
    - Atomic: all-or-nothing semantics (single COMMIT)
    - Safe for concurrent writes from multiple users

    Race condition protection:
    Two users posting to the same business concurrently could otherwise both
    read the ledger, apply conflicting updates, and silently corrupt balance
    totals. The per-business advisory transaction lock serializes those
    writes without the cost (and SQLite incompatibility) of SERIALIZABLE.
    """

    # 1. Validate currency — a journal entry can never carry a different
    #    accounting currency than the business it belongs to. This is
    #    enforced here (not just at each API endpoint) so there is no path,
    #    present or future, that can slip a mismatched currency in.
    if data.currency != business_base_currency:
        raise ValueError(
            f"Currency mismatch: this business's base currency is {business_base_currency}, "
            f"not {data.currency}. Transactions cannot use a different currency."
        )
    if data.currency not in SUPPORTED_CURRENCIES:
        raise ValueError(
            f"Unsupported currency: {data.currency}"
        )

    # 2. Journal entry must have at least 2 lines
    if len(data.lines) < 2:
        raise ValueError(
            "A journal entry must have at least two lines."
        )

    total_debit = Decimal("0")
    total_credit = Decimal("0")

    # 3. Validate every line
    for line in data.lines:

        if line.debit > 0 and line.credit > 0:
            raise ValueError(
                "A journal line cannot have both debit and credit."
            )

        if line.debit == 0 and line.credit == 0:
            raise ValueError(
                "A journal line must have either debit or credit."
            )

        total_debit += line.debit
        total_credit += line.credit

    # 4. Double-entry rule - validate BEFORE any database writes
    if total_debit != total_credit:
        raise ValueError(
            f"Journal entry is not balanced: "
            f"debit={total_debit}, credit={total_credit}"
        )

    # 5. Serialize concurrent writes for THIS business with a PostgreSQL
    #    advisory transaction lock. The callers (routes) already ran queries
    #    on this session (e.g. business ownership check), so the transaction
    #    is already open and `SET TRANSACTION ISOLATION LEVEL` would fail.
    #    An advisory xact lock is a per-business write mutex tied to the open
    #    transaction: it prevents write skew / phantom rows when two users
    #    post to the same ledger concurrently, and it auto-releases on commit
    #    or rollback. SQLite doesn't support advisory locks, so it is guarded
    #    to PostgreSQL dialects only (tests keep running on SQLite).
    bind = db.get_bind()
    if bind.dialect.name.startswith("postgresql") and data.business_id:
        db.execute(sa.text("SELECT pg_advisory_xact_lock(:key)").bindparams(
            key=int(hashlib.sha1(data.business_id.encode("utf-8")).hexdigest()[:15], 16)
        ))

    try:
        # 6. Create journal entry
        entry = JournalEntry(
            business_id=data.business_id,
            description=data.description,
            currency=data.currency,
        )

        db.add(entry)
        db.flush()

        # 7. Create journal lines
        for line in data.lines:
            journal_line = JournalLine(
                journal_entry_id=entry.id,
                account_id=line.account_id,
                debit=line.debit,
                credit=line.credit,
                description=line.description,
            )
            db.add(journal_line)

        # 8. Commit everything atomically
        db.commit()
        db.refresh(entry)

        return entry

    except sa.exc.OperationalError as e:
        # Serialization failure - another transaction conflicted
        db.rollback()
        if "could not serialize" in str(e).lower():
            raise ValueError(
                "Transaction conflict detected. Please try again."
            ) from e
        raise
    except Exception:
        db.rollback()
        raise


def summarize_entry(entry: JournalEntry) -> dict:
    """Pick the more meaningful side of a journal entry to display.

    Naively always reporting "the line with a debit" mislabels revenue
    transactions: a sale debits Cash/Bank (an asset), so that heuristic would
    show the category as "Cash" and the amount as negative, as if it were an
    expense. Instead: revenue transactions report the revenue account
    (positive amount), expense transactions report the expense account
    (negative amount), and anything else falls back to the debited line.
    """
    revenue_line = next((line for line in entry.lines if line.account and line.account.account_type == "revenue"), None)
    if revenue_line:
        return {"category": revenue_line.account.name, "amount": revenue_line.credit}

    expense_line = next((line for line in entry.lines if line.account and line.account.account_type == "expense"), None)
    if expense_line:
        return {"category": expense_line.account.name, "amount": -expense_line.debit}

    debit_line = next((line for line in entry.lines if line.debit > 0), None)
    if debit_line:
        return {"category": debit_line.account.name if debit_line.account else "Other", "amount": -debit_line.debit}

    return {"category": "Other", "amount": Decimal("0")}


def compute_account_balances(db: Session, business_id: str) -> dict[str, Decimal]:
    """Net balance per account, derived from posted journal lines.

    This is the single source of truth for "what does this account hold" —
    used by the accounts list, the dashboard, and the AI assistant's Q&A —
    so none of them can silently drift out of sync with each other.

    PERFORMANCE: Uses eager loading to prevent N+1 queries. For 1000 concurrent
    users, this reduces database round-trips from O(accounts * lines) to O(1).
    """
    from sqlalchemy.orm import joinedload

    # Eager load journal lines to prevent N+1 queries
    accounts = (
        db.query(Account)
        .filter(Account.business_id == business_id)
        .options(joinedload(Account.journal_lines))
        .all()
    )
    balances: dict[str, Decimal] = {account.id: Decimal("0") for account in accounts}

    for account in accounts:
        net = Decimal("0")
        for line in account.journal_lines:
            if account.account_type in _DEBIT_NORMAL_TYPES:
                net += line.debit - line.credit
            else:
                net += line.credit - line.debit
        balances[account.id] = net

    return balances


def compute_overview(db: Session, business_id: str) -> dict:
    """Aggregate balance/revenue/expenses/cash-flow + recent transactions.

    Shared by the /overview endpoint, the accounts endpoint, and the AI
    assistant's question-answering — real numbers everywhere, computed once.

    PERFORMANCE: Eager loads lines and accounts to prevent N+1 queries.
    """
    from sqlalchemy.orm import joinedload

    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.business_id == business_id)
        .options(
            joinedload(JournalEntry.lines).joinedload(JournalLine.account)
        )
        .order_by(JournalEntry.transaction_date.desc())
        .all()
    )

    revenue = Decimal("0")
    expenses = Decimal("0")
    balance = Decimal("0")
    cash_flow = Decimal("0")

    recent_transactions = []

    for entry in entries:
        for line in entry.lines:
            if not line.account:
                continue
            account_type = line.account.account_type

            if account_type == "revenue":
                revenue += line.credit - line.debit
            elif account_type == "expense":
                expenses += line.debit - line.credit
            elif account_type == "asset":
                balance += line.debit - line.credit
                cash_flow += line.debit - line.credit
            elif account_type == "liability":
                balance -= line.credit - line.debit

        summary = summarize_entry(entry)

        recent_transactions.append(
            {
                "id": entry.id,
                "description": entry.description,
                "category": summary["category"],
                "date": entry.transaction_date.isoformat(),
                "amount": str(summary["amount"]),
                "currency": entry.currency,
                "status": "posted",
            }
        )

    return {
        "balance": balance,
        "revenue": revenue,
        "expenses": expenses,
        "cash_flow": revenue - expenses,
        "recent_transactions": recent_transactions[:5],
    }
