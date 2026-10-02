"""Integration tests for RIVA conversation + analytics services.

Uses an in-memory SQLite engine so it runs anywhere without a database.
Verifies the invariants that matter for the AI assistant:
- Business isolation (a conversation never crosses businesses)
- Ownership enforcement
- Message isolation between conversations
- Multi-turn history (get_recent_messages)
- Deterministic financial totals (revenue/expenses/net income come from DB)
- Conversation title derivation, listing, deletion
"""

from decimal import Decimal
import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import Business, Account
from conversation_service import (
    create_conversation,
    list_conversations,
    get_conversation_messages,
    get_recent_messages,
    add_message,
    derive_title_from_message,
    verify_conversation_ownership,
    delete_conversation,
)
from accounting_service import create_journal_entry
from schemas import JournalEntryInput, JournalLineInput
from analytics_service import get_period_totals, get_expense_breakdown, get_revenue_breakdown
from financial_periods import default_period


def _make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _mk_accounts(db, business, rows):
    accounts = {}
    for code, name, atype in rows:
        account = Account(business_id=business.id, name=name, account_type=atype, code=code)
        db.add(account)
        accounts[name] = account
    return accounts


def _record(db, business, debit_acct, credit_acct, amount, description):
    """Post a balanced journal entry: debit `debit_acct`, credit `credit_acct`."""
    entry = JournalEntryInput(
        business_id=business.id,
        description=description,
        currency=business.base_currency,
        lines=[
            JournalLineInput(account_id=debit_acct.id, debit=amount, credit=Decimal("0")),
            JournalLineInput(account_id=credit_acct.id, debit=Decimal("0"), credit=amount),
        ],
    )
    create_journal_entry(db, entry, business.base_currency)


class ConversationServiceTests(unittest.TestCase):
    def setUp(self):
        self.db = _make_session()
        self.b1 = Business(name="Biz A", language="fa", base_currency="IRR")
        self.b2 = Business(name="Biz B", language="fa", base_currency="TOMAN")
        self.db.add_all([self.b1, self.b2])
        self.db.flush()
        self.accounts_b1 = _mk_accounts(self.db, self.b1, [
            ("1000", "Cash", "asset"),
            ("1010", "Bank", "asset"),
            ("4000", "Sales Revenue", "revenue"),
            ("5200", "Marketing Expense", "expense"),
            ("5100", "Rent Expense", "expense"),
        ])
        self.db.flush()

    def tearDown(self):
        self.db.close()

    def test_conversations_are_isolated_per_business(self):
        c1 = create_conversation(self.db, self.b1.id)["id"]
        create_conversation(self.db, self.b1.id)
        create_conversation(self.db, self.b2.id)
        self.assertEqual(len(list_conversations(self.db, self.b1.id)), 2)
        self.assertEqual(len(list_conversations(self.db, self.b2.id)), 1)
        self.assertNotEqual(c1, "")

    def test_ownership_enforced(self):
        create_conversation(self.db, self.b2.id)
        other = create_conversation(self.db, self.b2.id)
        with self.assertRaises(ValueError):
            verify_conversation_ownership(self.db, other["id"], self.b1.id)

    def test_messages_never_mix_between_conversations(self):
        c1 = create_conversation(self.db, self.b1.id)["id"]
        c2 = create_conversation(self.db, self.b1.id)["id"]

        add_message(self.db, c1, "user", "text", "How much did we spend on marketing?")
        add_message(self.db, c1, "assistant", "answer", "300,000 IRR")
        add_message(self.db, c2, "user", "text", "What is our balance?")
        add_message(self.db, c2, "assistant", "answer", "Balance is 500,000 IRR")

        m1 = get_conversation_messages(self.db, c1)
        m2 = get_conversation_messages(self.db, c2)
        self.assertEqual(len(m1), 2)
        self.assertEqual(len(m2), 2)
        self.assertEqual(m1[0]["content"], "How much did we spend on marketing?")
        self.assertEqual(m2[0]["content"], "What is our balance?")
        self.assertNotIn("balance", m1[1]["content"])

    def test_recent_messages_returns_turn_history(self):
        c1 = create_conversation(self.db, self.b1.id)["id"]
        add_message(self.db, c1, "user", "text", "First")
        add_message(self.db, c1, "assistant", "answer", "Reply")
        add_message(self.db, c1, "user", "text", "Of that, how much is marketing?")
        recent = get_recent_messages(self.db, c1, limit=12)
        self.assertEqual(
            [r["content"] for r in recent],
            ["First", "Reply", "Of that, how much is marketing?"],
        )

    def test_title_derivation(self):
        self.assertEqual(derive_title_from_message(None), "New conversation")
        self.assertEqual(derive_title_from_message("  "), "New conversation")
        self.assertEqual(
            derive_title_from_message("How much did we spend last month?"),
            "How much did we spend last month?",
        )
        long_title = derive_title_from_message("x" * 100)
        self.assertLessEqual(len(long_title), 63)  # 60 + "..."

    def test_delete_conversation(self):
        c1 = create_conversation(self.db, self.b1.id)["id"]
        self.assertTrue(delete_conversation(self.db, c1, self.b1.id))
        self.assertEqual(len(list_conversations(self.db, self.b1.id)), 0)


class DeterministicAnalyticsTests(unittest.TestCase):
    def setUp(self):
        self.db = _make_session()
        self.b1 = Business(name="Biz A", language="fa", base_currency="IRR")
        self.db.add(self.b1)
        self.db.flush()
        self.accounts = _mk_accounts(self.db, self.b1, [
            ("1000", "Cash", "asset"),
            ("1010", "Bank", "asset"),
            ("4000", "Sales Revenue", "revenue"),
            ("5200", "Marketing Expense", "expense"),
            ("5100", "Rent Expense", "expense"),
        ])
        self.db.flush()
        self.period = default_period()

    def tearDown(self):
        self.db.close()

    def test_totals_are_computed_from_db(self):
        _record(self.db, self.b1, self.accounts["Bank"], self.accounts["Sales Revenue"], Decimal("1000000"), "Sale")
        _record(self.db, self.b1, self.accounts["Marketing Expense"], self.accounts["Cash"], Decimal("300000"), "Marketing")
        _record(self.db, self.b1, self.accounts["Rent Expense"], self.accounts["Cash"], Decimal("200000"), "Rent")

        totals = get_period_totals(self.db, self.b1.id, self.period)
        self.assertEqual(totals.revenue, Decimal("1000000"))
        self.assertEqual(totals.expenses, Decimal("500000"))
        self.assertEqual(totals.net_income, Decimal("500000"))

    def test_expense_and_revenue_breakdowns(self):
        _record(self.db, self.b1, self.accounts["Bank"], self.accounts["Sales Revenue"], Decimal("1000000"), "Sale")
        _record(self.db, self.b1, self.accounts["Marketing Expense"], self.accounts["Cash"], Decimal("300000"), "Marketing")
        _record(self.db, self.b1, self.accounts["Rent Expense"], self.accounts["Cash"], Decimal("200000"), "Rent")

        expenses = get_expense_breakdown(self.db, self.b1.id, self.period)
        self.assertEqual(expenses[0].category, "Marketing Expense")
        self.assertEqual(expenses[0].amount, Decimal("300000"))

        revenue = get_revenue_breakdown(self.db, self.b1.id, self.period)
        self.assertEqual(revenue[0].category, "Sales Revenue")
        self.assertEqual(revenue[0].amount, Decimal("1000000"))

    def test_balances_reflect_posted_entries(self):
        _record(self.db, self.b1, self.accounts["Bank"], self.accounts["Sales Revenue"], Decimal("1000000"), "Sale")
        _record(self.db, self.b1, self.accounts["Marketing Expense"], self.accounts["Cash"], Decimal("300000"), "Marketing")
        from analytics_service import get_account_balances
        balances = {b.name: b.balance for b in get_account_balances(self.db, self.b1.id)}
        self.assertEqual(balances["Bank"], Decimal("1000000"))
        self.assertEqual(balances["Cash"], Decimal("-300000"))
        self.assertEqual(balances["Sales Revenue"], Decimal("1000000"))
        self.assertEqual(balances["Marketing Expense"], Decimal("300000"))


if __name__ == "__main__":
    unittest.main()