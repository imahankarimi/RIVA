"""Integration tests for AI tool execution against a real (in-memory) chart of
accounts. Verifies:

- Every registered tool returns structured, deterministic data
- Tool results are driven by the DB, not the AI
- Business isolation (tools use the authenticated business_id, never the LLM)
- Report export produces a real download_url

All numbers in the assertions below are computed by the analytics service from
posted journal entries — the same numbers an AI tool call would retrieve.
"""

from datetime import datetime, timedelta
from decimal import Decimal
import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import Business, Account, JournalEntry
from accounting_service import create_journal_entry
from schemas import JournalEntryInput, JournalLineInput
from ai_tools import execute_tool, TOOL_DEFINITIONS

TOTAL_REVENUE = "117400.00"
TOTAL_EXPENSES = "16300.00"
TOTAL_NET = "101100.00"


class ToolExecutionTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.business = Business(name="Coffee Store", language="en", base_currency="USD")
        self.db.add(self.business)
        self.db.flush()
        self.accounts = {}
        for code, name, atype in [
            ("1000", "Cash", "asset"),
            ("1010", "Bank", "asset"),
            ("4000", "Sales Revenue", "revenue"),
            ("4001", "Arabica Sales", "revenue"),
            ("4002", "Robusta Sales", "revenue"),
            ("5200", "Marketing Expense", "expense"),
            ("5100", "Rent Expense", "expense"),
            ("5110", "Supplies Expense", "expense"),
        ]:
            account = Account(business_id=self.business.id, name=name, account_type=atype, code=code)
            self.db.add(account)
            self.accounts[name] = account
        self.db.flush()

        # Deterministic sample data — every one of these is a *real* posted
        # journal entry, the same shape the accounting engine produces.
        self._record(self.accounts["Bank"], self.accounts["Sales Revenue"], "84000", "General sales")
        self._record(self.accounts["Bank"], self.accounts["Arabica Sales"], "21400", "Arabica beans")
        self._record(self.accounts["Bank"], self.accounts["Robusta Sales"], "12000", "Robusta beans")
        self._record(self.accounts["Marketing Expense"], self.accounts["Cash"], "5200", "Ads")
        self._record(self.accounts["Rent Expense"], self.accounts["Cash"], "8000", "Rent")
        self._record(self.accounts["Supplies Expense"], self.accounts["Cash"], "3100", "Cups")

    def tearDown(self):
        self.db.close()

    def _record(self, debit_acct, credit_acct, amount, desc):
        entry = JournalEntryInput(
            business_id=self.business.id,
            description=desc,
            currency=self.business.base_currency,
            lines=[
                JournalLineInput(account_id=debit_acct.id, debit=Decimal(amount), credit=Decimal("0")),
                JournalLineInput(account_id=credit_acct.id, debit=Decimal("0"), credit=Decimal(amount)),
            ],
        )
        create_journal_entry(self.db, entry, self.business.base_currency)

    def _run(self, tool, args=None):
        return execute_tool(
            tool_name=tool,
            arguments=args or {},
            db=self.db,
            business_id=self.business.id,
            business_name=self.business.name,
            base_currency=self.business.base_currency,
        )

    def test_analytics_totals_are_deterministic(self):
        r = self._run("get_financial_analytics")
        self.assertTrue(r["success"])
        self.assertEqual(r["data"]["period_totals"]["revenue"], TOTAL_REVENUE)
        self.assertEqual(r["data"]["period_totals"]["expenses"], TOTAL_EXPENSES)
        self.assertEqual(r["data"]["period_totals"]["net_income"], TOTAL_NET)

    def test_revenue_breakdown_by_source(self):
        r = self._run("get_revenue_breakdown")
        self.assertTrue(r["success"])
        cats = [x["category"] for x in r["data"]["breakdown"]]
        self.assertIn("Sales Revenue", cats)
        self.assertIn("Arabica Sales", cats)
        self.assertIn("Robusta Sales", cats)

    def test_top_expenses(self):
        r = self._run("get_top_expenses")
        self.assertTrue(r["success"])
        self.assertEqual(r["data"]["top_categories"][0]["category"], "Rent Expense")

    def test_profit_loss(self):
        r = self._run("get_profit_loss")
        self.assertTrue(r["success"])
        self.assertEqual(r["data"]["net_income"], TOTAL_NET)

    def test_expense_category_filter(self):
        r = self._run("get_expenses", {"category": "marketing"})
        self.assertTrue(r["success"])
        self.assertEqual(r["data"]["breakdown"][0]["category"], "Marketing Expense")

    def test_transactions_listed(self):
        r = self._run("get_transactions")
        self.assertTrue(r["success"])
        self.assertEqual(len(r["data"]["transactions"]), 6)

    def test_account_balances(self):
        r = self._run("get_account_balances")
        self.assertTrue(r["success"])
        bal = {x["name"]: x["balance"] for x in r["data"]["balances"]}
        # All three revenue entries debit Bank (84000 + 21400 + 12000)
        self.assertEqual(bal["Bank"], "117400.00")
        # All three expense entries credit Cash (5200 + 8000 + 3100)
        self.assertEqual(bal["Cash"], "-16300.00")

    def test_compare_periods(self):
        r = self._run("compare_periods", {
            "current_period": "last 30 days",
            "previous_period": "last month",
        })
        self.assertTrue(r["success"])
        self.assertIsNotNone(r["data"].get("change_revenue_pct"))

    def test_recommendations_have_messages(self):
        r = self._run("get_recommendations")
        self.assertTrue(r["success"])
        for rec in r["data"]["recommendations"]:
            self.assertTrue(rec["message"])

    def test_report_structured(self):
        r = self._run("get_report", {"report": "profit_loss"})
        self.assertTrue(r["success"])
        self.assertEqual(r["data"]["summary"]["revenue"], TOTAL_REVENUE)

    def test_report_export_produces_download_url(self):
        r = self._run("get_report", {"report": "profit_loss", "format": "csv"})
        self.assertTrue(r["success"])
        self.assertTrue(r["export"]["download_path"].startswith("/api/businesses/"))
        self.assertTrue(r["export"]["filename"].startswith("riva-"))
        self.assertTrue(r["export"]["filename"].endswith(".csv"))

    def test_tools_never_trust_llm_business_id(self):
        r = self._run("get_account_balances", {"business_id": "fake-id"})
        self.assertTrue(r["success"])  # ignores the injected id
        self.assertEqual(len(r["data"]["balances"]), 8)  # the real business's accounts

    def test_registered_tools_are_meaningful(self):
        names = {t["function"]["name"] for t in TOOL_DEFINITIONS}
        self.assertIn("get_financial_analytics", names)
        self.assertIn("get_revenue_breakdown", names)
        self.assertIn("get_top_expenses", names)
        self.assertNotIn("create_expense", names)
        self.assertNotIn("create_income", names)


if __name__ == "__main__":
    unittest.main()