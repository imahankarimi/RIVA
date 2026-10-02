"""Financial Context Service — builds a compact, relevant business context for the AI.

Rather than dumping the entire database into the prompt, this service
constructs a focused context summary:
- Business identity (name, type, currency)
- Account structure (ids, names, types)
- Recent activity overview
- Current period totals
- Key balances

The AI combines this context with tool calls to retrieve the specific
data it needs per question.
"""

from dataclasses import dataclass, field
from decimal import Decimal
from sqlalchemy.orm import Session

from models import Account, Business
from analytics_service import (
    get_account_balances,
    get_period_totals,
    get_expense_breakdown,
    get_revenue_breakdown,
    get_transactions,
)
from financial_periods import default_period


@dataclass
class BusinessContext:
    business_name: str
    base_currency: str
    language: str
    context_text: str | None
    accounts: list[dict]
    period_totals: dict
    balances: dict[str, str]
    recent_transactions: list[dict]
    expense_breakdown: list[dict]
    revenue_breakdown: list[dict]

    def to_prompt(self) -> str:
        """Compact prompt representation for the AI."""
        lines = [
            f"Business: {self.business_name}",
            f"Base currency: {self.base_currency}",
            f"Language: {self.language}",
        ]

        if self.context_text:
            lines.append(f"Business context: {self.context_text}")

        lines.append("")
        lines.append("Accounts (id: name [type]):")
        for account in self.accounts:
            lines.append(f"  {account['id']}: {account['name']} [{account['type']}]")

        lines.append("")
        lines.append(f"Current overview (last 30 days, {self.base_currency}):")
        lines.append(f"  Revenue: {self.period_totals.get('revenue', '0')}")
        lines.append(f"  Expenses: {self.period_totals.get('expenses', '0')}")
        lines.append(f"  Net income: {self.period_totals.get('net_income', '0')}")

        if self.expense_breakdown:
            lines.append("  Expense categories:")
            for e in self.expense_breakdown[:5]:
                lines.append(f"    {e['category']}: {e['amount']} ({e['percentage']}%)")

        if self.revenue_breakdown:
            lines.append("  Revenue by source:")
            for r in self.revenue_breakdown[:5]:
                lines.append(f"    {r['category']}: {r['amount']} ({r['percentage']}%)")

        if self.balances:
            lines.append("  Account balances:")
            for name, balance in list(self.balances.items())[:8]:
                lines.append(f"    {name}: {balance}")

        return "\n".join(lines)


def build_business_context(db: Session, business: Business) -> BusinessContext:
    """Build the AI context for a business."""
    accounts = (
        db.query(Account)
        .filter(Account.business_id == business.id)
        .order_by(Account.code)
        .all()
    )

    period = default_period()
    totals = get_period_totals(db, business.id, period)
    balances = get_account_balances(db, business.id)
    expense_breakdown = get_expense_breakdown(db, business.id, period)
    revenue_breakdown = get_revenue_breakdown(db, business.id, period)
    recent_txns = get_transactions(db, business.id, period, limit=5)

    return BusinessContext(
        business_name=business.name,
        base_currency=business.base_currency,
        language=business.language,
        context_text=business.context_text,
        accounts=[
            {
                "id": account.id,
                "name": account.name,
                "type": account.account_type,
                "code": account.code,
            }
            for account in accounts
        ],
        period_totals={
            "revenue": str(totals.revenue),
            "expenses": str(totals.expenses),
            "net_income": str(totals.net_income),
        },
        balances={
            b.name: str(b.balance)
            for b in balances
            if b.balance != Decimal("0")
        },
        recent_transactions=[t.to_dict() for t in recent_txns],
        expense_breakdown=[e.to_dict() for e in expense_breakdown],
        revenue_breakdown=[r.to_dict() for r in revenue_breakdown],
    )