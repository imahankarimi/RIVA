"""Deterministic financial analytics — single source of truth for numbers.

This module provides all financial calculations that the AI assistant
uses. The AI interprets these structured results; it never performs the
raw math itself.

Architecture:
DATABASE
  ↓
ANALYTICS SERVICE (this module)
  ↓
STRUCTURED DATA (dataclasses)
  ↓
AI (interpretation, recommendations)
  ↓
FRONTEND (explanation, insights)

CRITICAL RULE:
Every number the AI reports MUST come from here. The AI's job is to
explain what the numbers mean, not to compute them.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from models import Account, JournalEntry, JournalLine, Business
from financial_periods import Period


# ---------------------------------------------------------------------------
# Data classes for structured results
# ---------------------------------------------------------------------------

@dataclass
class AccountBalance:
    id: str
    name: str
    account_type: str
    code: str | None
    balance: Decimal

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "account_type": self.account_type,
            "code": self.code,
            "balance": str(self.balance),
        }


@dataclass
class TransactionSummary:
    id: str
    description: str
    category: str
    date: datetime
    amount: Decimal
    currency: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "description": self.description,
            "category": self.category,
            "date": self.date.isoformat(),
            "amount": str(self.amount),
            "currency": self.currency,
        }


@dataclass
class PeriodTotals:
    revenue: Decimal = Decimal("0")
    expenses: Decimal = Decimal("0")
    net_income: Decimal = Decimal("0")
    cash_flow: Decimal = Decimal("0")
    transaction_count: int = 0

    def to_dict(self) -> dict:
        return {
            "revenue": str(self.revenue),
            "expenses": str(self.expenses),
            "net_income": str(self.net_income),
            "cash_flow": str(self.cash_flow),
            "transaction_count": self.transaction_count,
        }


@dataclass
class PeriodComparison:
    current: PeriodTotals
    previous: PeriodTotals
    change_revenue_pct: Decimal | None = None
    change_expenses_pct: Decimal | None = None
    change_net_income_pct: Decimal | None = None

    def to_dict(self) -> dict:
        return {
            "current": self.current.to_dict(),
            "previous": self.previous.to_dict(),
            "change_revenue_pct": str(self.change_revenue_pct) if self.change_revenue_pct is not None else None,
            "change_expenses_pct": str(self.change_expenses_pct) if self.change_expenses_pct is not None else None,
            "change_net_income_pct": str(self.change_net_income_pct) if self.change_net_income_pct is not None else None,
        }


@dataclass
class ExpenseBreakdown:
    category: str
    amount: Decimal
    percentage: Decimal

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "amount": str(self.amount),
            "percentage": str(self.percentage),
        }


@dataclass
class AccountActivity:
    account_id: str
    account_name: str
    account_type: str
    total_debit: Decimal
    total_credit: Decimal
    net_change: Decimal
    transaction_count: int

    def to_dict(self) -> dict:
        return {
            "account_id": self.account_id,
            "account_name": self.account_name,
            "account_type": self.account_type,
            "total_debit": str(self.total_debit),
            "total_credit": str(self.total_credit),
            "net_change": str(self.net_change),
            "transaction_count": self.transaction_count,
        }


@dataclass
class Recommendation:
    category: str  # inventory_restock, expense_reduction, revenue_opportunity, etc.
    priority: str  # high, medium, low
    message: str
    metric: str | None = None
    period: str | None = None
    comparison: str | None = None
    reasoning: str | None = None

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "priority": self.priority,
            "message": self.message,
            "metric": self.metric,
            "period": self.period,
            "comparison": self.comparison,
            "reasoning": self.reasoning,
        }


# ---------------------------------------------------------------------------
# Account types classification
# ---------------------------------------------------------------------------

_DEBIT_NORMAL = {"asset", "expense"}
_CREDIT_NORMAL = {"liability", "equity", "revenue"}

# Accounts that represent cash/cash-equivalents for cash flow analysis
_CASH_ACCOUNTS = {"asset"}


# ---------------------------------------------------------------------------
# Core queries
# ---------------------------------------------------------------------------

def _debit_normal(account_type: str) -> bool:
    return account_type in _DEBIT_NORMAL


def get_account_balances(db: Session, business_id: str, period: Period | None = None) -> list[AccountBalance]:
    """Get all account balances for a business, optionally filtered by period."""
    # Eager-load journal lines AND the entry each line belongs to so the
    # period filter does not trigger a lazy per-line SELECT (N+1). Without
    # this, get_full_analytics fires one query per journal line per account.
    accounts = (
        db.query(Account)
        .filter(Account.business_id == business_id)
        .options(
            joinedload(Account.journal_lines).joinedload(JournalLine.journal_entry)
        )
        .all()
    )
    balances = []

    for account in accounts:
        net = Decimal("0")
        for line in account.journal_lines:
            entry = line.journal_entry
            if period and period.start and entry.transaction_date < period.start:
                continue
            if period and period.end and entry.transaction_date >= period.end:
                continue

            if _debit_normal(account.account_type):
                net += line.debit - line.credit
            else:
                net += line.credit - line.debit

        balances.append(AccountBalance(
            id=account.id,
            name=account.name,
            account_type=account.account_type,
            code=account.code,
            balance=net,
        ))

    return balances


def _entries_with_lines(db: Session, business_id: str) -> list[JournalEntry]:
    """Fetch a business's journal entries with lines+accounts eager-loaded.

    Shared by every analytics query. Loading `lines` and `lines.account` up
    front turns the old O(n) lazy-load-per-line pattern into two queries total
    (entries ∪ lines) — critical because get_full_analytics runs several of
    these back-to-back per AI message.
    """
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.business_id == business_id)
        .options(
            joinedload(JournalEntry.lines).joinedload(JournalLine.account)
        )
        .all()
    )


def get_period_totals(db: Session, business_id: str, period: Period) -> PeriodTotals:
    """Calculate revenue, expenses, net income, and cash flow for a period."""
    entries = _entries_with_lines(db, business_id)

    totals = PeriodTotals()

    for entry in entries:
        if period.start and entry.transaction_date < period.start:
            continue
        if period.end and entry.transaction_date >= period.end:
            continue

        totals.transaction_count += 1

        for line in entry.lines:
            if not line.account:
                continue

            if line.account.account_type == "revenue":
                totals.revenue += line.credit - line.debit
            elif line.account.account_type == "expense":
                totals.expenses += line.debit - line.credit
            elif line.account.account_type == "asset":
                totals.cash_flow += line.debit - line.credit

    totals.net_income = totals.revenue - totals.expenses
    return totals


def get_period_comparison(
    db: Session, business_id: str, current_period: Period, previous_period: Period
) -> PeriodComparison:
    """Compare two periods with percentage changes."""
    current = get_period_totals(db, business_id, current_period)
    previous = get_period_totals(db, business_id, previous_period)

    def calc_change(curr: Decimal, prev: Decimal) -> Decimal | None:
        if prev == 0:
            return None if curr == 0 else Decimal("100.0")
        change = ((curr - prev) / abs(prev)) * 100
        return change.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)

    return PeriodComparison(
        current=current,
        previous=previous,
        change_revenue_pct=calc_change(current.revenue, previous.revenue),
        change_expenses_pct=calc_change(current.expenses, previous.expenses),
        change_net_income_pct=calc_change(current.net_income, previous.net_income),
    )


def get_expense_breakdown(db: Session, business_id: str, period: Period | None = None) -> list[ExpenseBreakdown]:
    """Get expenses grouped by category with percentages."""
    entries = _entries_with_lines(db, business_id)

    category_totals: dict[str, Decimal] = {}

    for entry in entries:
        if period and period.start and entry.transaction_date < period.start:
            continue
        if period and period.end and entry.transaction_date >= period.end:
            continue

        for line in entry.lines:
            if line.account and line.account.account_type == "expense":
                amount = line.debit - line.credit
                if amount > 0:
                    category_totals[line.account.name] = category_totals.get(line.account.name, Decimal("0")) + amount

    total = sum(category_totals.values(), Decimal("0"))
    if total == 0:
        return []

    breakdown = []
    for name, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        percentage = (amount / total * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        breakdown.append(ExpenseBreakdown(
            category=name,
            amount=amount,
            percentage=percentage,
        ))

    return breakdown


def get_revenue_breakdown(
    db: Session, business_id: str, period: Period | None = None
) -> list[ExpenseBreakdown]:
    """Get revenue grouped by revenue account (e.g. sales by product line).

    Mirrors get_expense_breakdown but on the credit side of revenue accounts.
    """
    entries = _entries_with_lines(db, business_id)

    revenue_totals: dict[str, Decimal] = {}

    for entry in entries:
        if period and period.start and entry.transaction_date < period.start:
            continue
        if period and period.end and entry.transaction_date >= period.end:
            continue

        for line in entry.lines:
            if line.account and line.account.account_type == "revenue":
                amount = line.credit - line.debit
                if amount > 0:
                    revenue_totals[line.account.name] = revenue_totals.get(line.account.name, Decimal("0")) + amount

    total = sum(revenue_totals.values(), Decimal("0"))
    if total == 0:
        return []

    breakdown = []
    for name, amount in sorted(revenue_totals.items(), key=lambda x: x[1], reverse=True):
        percentage = (amount / total * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        breakdown.append(ExpenseBreakdown(
            category=name,
            amount=amount,
            percentage=percentage,
        ))

    return breakdown


def get_top_expense_categories(
    db: Session, business_id: str, period: Period | None = None, limit: int = 5
) -> list[ExpenseBreakdown]:
    """Top expense categories by amount for a period (default 5)."""
    return get_expense_breakdown(db, business_id, period)[:max(1, limit)]


def get_account_activity(
    db: Session, business_id: str, period: Period | None = None
) -> list[AccountActivity]:
    """Get activity summary for all accounts in a period."""
    accounts = (
        db.query(Account)
        .filter(Account.business_id == business_id)
        .options(
            joinedload(Account.journal_lines).joinedload(JournalLine.journal_entry)
        )
        .all()
    )
    activity = []

    for account in accounts:
        total_debit = Decimal("0")
        total_credit = Decimal("0")
        txn_count = 0

        for line in account.journal_lines:
            entry = line.journal_entry
            if period and period.start and entry.transaction_date < period.start:
                continue
            if period and period.end and entry.transaction_date >= period.end:
                continue

            total_debit += line.debit
            total_credit += line.credit
            txn_count += 1

        if txn_count == 0:
            continue

        if _debit_normal(account.account_type):
            net_change = total_debit - total_credit
        else:
            net_change = total_credit - total_debit

        activity.append(AccountActivity(
            account_id=account.id,
            account_name=account.name,
            account_type=account.account_type,
            total_debit=total_debit,
            total_credit=total_credit,
            net_change=net_change,
            transaction_count=txn_count,
        ))

    return activity


def get_transactions(
    db: Session,
    business_id: str,
    period: Period | None = None,
    category: str | None = None,
    limit: int = 50,
) -> list[TransactionSummary]:
    """Get transactions for a period, optionally filtered by category."""
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.business_id == business_id)
        .options(
            joinedload(JournalEntry.lines).joinedload(JournalLine.account)
        )
        .order_by(JournalEntry.transaction_date.desc())
        .all()
    )

    transactions = []

    for entry in entries:
        if period and period.start and entry.transaction_date < period.start:
            continue
        if period and period.end and entry.transaction_date >= period.end:
            continue

        if not entry.lines:
            continue

        # Determine the category from the most meaningful line
        category_name = "Other"
        amount = Decimal("0")

        # Prefer revenue line
        for line in entry.lines:
            if line.account and line.account.account_type == "revenue":
                category_name = line.account.name
                amount = line.credit
                break

        # If no revenue line, use expense line
        if category_name == "Other":
            for line in entry.lines:
                if line.account and line.account.account_type == "expense":
                    category_name = line.account.name
                    amount = -line.debit
                    break

        # If still no match, use the first debit line
        if category_name == "Other":
            for line in entry.lines:
                if line.debit > 0:
                    category_name = line.account.name if line.account else "Other"
                    amount = -line.debit
                    break

        # Filter by category if specified
        if category and category.lower() not in category_name.lower():
            continue

        transactions.append(TransactionSummary(
            id=entry.id,
            description=entry.description,
            category=category_name,
            date=entry.transaction_date,
            amount=amount,
            currency=entry.currency,
        ))

        if len(transactions) >= limit:
            break

    return transactions


# ---------------------------------------------------------------------------
# Recommendation engine
# ---------------------------------------------------------------------------

def generate_recommendations(
    db: Session,
    business_id: str,
    current_period: Period,
    previous_period: Period | None = None,
) -> list[Recommendation]:
    """Generate actionable recommendations based on real data.

    Recommendations are backed by actual calculations — no unsupported claims.
    When no previous_period is supplied, a same-length period immediately
    before the current one is used for comparisons.
    """
    recommendations = []

    if previous_period is None and current_period.start and current_period.end:
        duration = current_period.end - current_period.start
        prev_end = current_period.start
        prev_start = prev_end - duration
        previous_period = Period(
            label=f"previous {current_period.label}",
            start=prev_start,
            end=prev_end,
        )

    current_totals = get_period_totals(db, business_id, current_period)
    expenses = get_expense_breakdown(db, business_id, current_period)
    account_activity = get_account_activity(db, business_id, current_period)

    # 1. Unusual spending patterns
    if expenses and len(expenses) > 1:
        largest = expenses[0]
        if largest.percentage > Decimal("40"):
            recommendations.append(Recommendation(
                category="expense_concentration",
                priority="high",
                message=f"{largest.category} represents {largest.percentage}% of total expenses ({str(largest.amount)}). Consider if this concentration is intentional.",
                metric=f"{largest.percentage}% of expenses",
                period=current_period.label,
                reasoning=f"The largest expense category {largest.category} accounts for {largest.percentage}% of all expenses.",
            ))

    # 2. High-growth expense categories
    if previous_period:
        prev_expenses = get_expense_breakdown(db, business_id, previous_period)
        prev_by_name = {e.category: e.amount for e in prev_expenses}

        for expense in expenses[:5]:
            prev_amount = prev_by_name.get(expense.category, Decimal("0"))
            if prev_amount > 0:
                growth = ((expense.amount - prev_amount) / prev_amount * 100).quantize(Decimal("0.1"))
                if growth > 20:
                    recommendations.append(Recommendation(
                        category="expense_increase",
                        priority="medium",
                        message=f"{expense.category} increased by {growth}% from {str(prev_amount)} to {str(expense.amount)}.",
                        metric=f"+{growth}%",
                        period=f"{previous_period.label} → {current_period.label}",
                        comparison=f"{str(prev_amount)} → {str(expense.amount)}",
                    ))

    # 3. Cash flow risks
    if current_totals.cash_flow < Decimal("0"):
        recommendations.append(Recommendation(
            category="cash_flow_risk",
            priority="high",
            message=f"Cash flow is negative ({str(current_totals.cash_flow)}). The business consumed more cash than it generated.",
            metric=str(current_totals.cash_flow),
            period=current_period.label,
        ))

    # 4. Revenue trends
    if current_totals.revenue < current_totals.expenses:
        recommendations.append(Recommendation(
            category="profitability_warning",
            priority="high",
            message=f"Expenses ({str(current_totals.expenses)}) exceed revenue ({str(current_totals.revenue)}).",
            metric=f"Net: {str(current_totals.net_income)}",
            period=current_period.label,
        ))

    # 5. Zero-revenue periods
    if current_totals.revenue == Decimal("0") and current_totals.transaction_count > 0:
        recommendations.append(Recommendation(
            category="revenue_gap",
            priority="high",
            message="No revenue recorded in this period despite transaction activity.",
            period=current_period.label,
        ))

    # 6. Large account balances without activity
    for activity in account_activity:
        if (activity.account_type == "asset" and
            activity.account_name.lower() in ("accounts receivable",) and
            activity.net_change > Decimal("0")):
            recommendations.append(Recommendation(
                category="receivables_risk",
                priority="medium",
                message=f"{activity.account_name} increased by {str(activity.net_change)}. Monitor for collection delays.",
                metric=str(activity.net_change),
                period=current_period.label,
            ))

    return recommendations


# ---------------------------------------------------------------------------
# Main analytics query (used by AI tools)
# ---------------------------------------------------------------------------

@dataclass
class BusinessAnalytics:
    """Complete financial snapshot for the AI to interpret."""
    business_name: str
    base_currency: str
    period: Period
    account_balances: list[AccountBalance]
    period_totals: PeriodTotals
    comparison: PeriodComparison | None
    expense_breakdown: list[ExpenseBreakdown]
    revenue_breakdown: list[ExpenseBreakdown] | None = None
    recent_transactions: list[TransactionSummary] | None = None
    account_activity: list[AccountActivity] | None = None
    recommendations: list[Recommendation] | None = None

    def to_dict(self) -> dict:
        return {
            "business_name": self.business_name,
            "base_currency": self.base_currency,
            "period": self.period.to_dict(),
            "account_balances": [b.to_dict() for b in self.account_balances],
            "period_totals": self.period_totals.to_dict(),
            "comparison": self.comparison.to_dict() if self.comparison else None,
            "expense_breakdown": [e.to_dict() for e in self.expense_breakdown],
            "revenue_breakdown": [r.to_dict() for r in (self.revenue_breakdown or [])],
            "recent_transactions": [t.to_dict() for t in (self.recent_transactions or [])[:10]],
            "account_activity": [a.to_dict() for a in (self.account_activity or [])],
            "recommendations": [r.to_dict() for r in (self.recommendations or [])],
        }


def get_full_analytics(
    db: Session,
    business_id: str,
    business_name: str,
    base_currency: str,
    period: Period,
    include_comparison: bool = True,
) -> BusinessAnalytics:
    """Get complete financial analytics for a business and period."""
    # Get current period totals
    period_totals = get_period_totals(db, business_id, period)

    # Compute previous period for comparison
    comparison = None
    if include_comparison and period.start and period.end:
        duration = period.end - period.start
        prev_end = period.start
        prev_start = prev_end - duration
        prev_period = Period(
            label=f"previous {period.label}",
            start=prev_start,
            end=prev_end,
        )
        comparison = get_period_comparison(db, business_id, period, prev_period)

    # Get other analytics
    account_balances = get_account_balances(db, business_id)
    expense_breakdown = get_expense_breakdown(db, business_id, period)
    revenue_breakdown = get_revenue_breakdown(db, business_id, period)
    recent_transactions = get_transactions(db, business_id, period, limit=10)
    account_activity = get_account_activity(db, business_id, period)

    # Generate recommendations
    recommendations = generate_recommendations(db, business_id, period)

    return BusinessAnalytics(
        business_name=business_name,
        base_currency=base_currency,
        period=period,
        account_balances=account_balances,
        period_totals=period_totals,
        comparison=comparison,
        expense_breakdown=expense_breakdown,
        revenue_breakdown=revenue_breakdown,
        recent_transactions=recent_transactions,
        account_activity=account_activity,
        recommendations=recommendations,
    )