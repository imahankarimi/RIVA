"""Regression tests for query-efficiency hardening.

Verifies the N+1 query fixes hold: the analytics and overview hot paths stay
bounded in the number of SQL statements they issue regardless of how many
journal entries / lines / accounts exist.

Run via the shared app:  DATABASE_URL=sqlite:///<path> python -m unittest test_query_performance
"""

import os
import unittest
from unittest.mock import patch

import sqlalchemy as sa
from sqlalchemy.event import listens_for


@listens_for(sa.engine.base.Engine, "before_cursor_execute", named=True)
def _count_queries(conn, cursor, statement, parameters, context, executemany):
    """Increment a query counter attached to the current thread."""
    import threading
    counter = getattr(threading.current_thread(), "_riva_query_count", None)
    if counter is not None:
        counter[0] += 1


def _query_count():
    """Return (and reset) the number of SQL statements the current thread issued."""
    import threading
    counter = getattr(threading.current_thread(), "_riva_query_count", None)
    if counter is None:
        return 0
    n = counter[0]
    counter[0] = 0
    return n


class _CountContext:
    def __enter__(self):
        import threading
        threading.current_thread()._riva_query_count = [0]
        return self

    def __exit__(self, *exc):
        import threading
        del threading.current_thread()._riva_query_count
        return False


class QueryPerformanceTests(unittest.TestCase):
    """"""

    @classmethod
    def setUpClass(cls):
        import models  # noqa: F401
        from database import Base, engine, SessionLocal

        Base.metadata.create_all(engine)
        cls.session = SessionLocal()

        # Seed a business with a realistic number of entries/lines.
        from models import Business, Account, JournalEntry, JournalLine
        from decimal import Decimal
        import uuid

        cls.business_id = str(uuid.uuid4())
        business = Business(
            id=cls.business_id,
            name="Perf Test Biz",
            language="en",
            base_currency="IRR",
        )
        cls.session.add(business)
        cls.session.flush()

        # 8 accounts, 200 entries x 2 lines each = 400 journal lines.
        bank = Account(business_id=cls.business_id, name="Bank", account_type="asset", code="1010")
        revenue = Account(business_id=cls.business_id, name="Sales", account_type="revenue", code="4010")
        expense = Account(business_id=cls.business_id, name="Utilities Expense", account_type="expense", code="5100")
        other = Account(business_id=cls.business_id, name="Cash", account_type="asset", code="1000")
        cls.session.add_all([bank, revenue, expense, other])
        cls.session.flush()

        for i in range(200):
            entry = JournalEntry(
                business_id=cls.business_id,
                description=f"entry {i}",
                currency="IRR",
            )
            cls.session.add(entry)
            cls.session.flush()
            cls.session.add(JournalLine(
                journal_entry_id=entry.id,
                account_id=expense.id,
                debit=Decimal("10000"),
                credit=Decimal("0"),
            ))
            cls.session.add(JournalLine(
                journal_entry_id=entry.id,
                account_id=bank.id,
                debit=Decimal("0"),
                credit=Decimal("10000"),
            ))
        cls.session.commit()

    @classmethod
    def tearDownClass(cls):
        cls.session.close()
        from database import engine
        engine.dispose()

    def test_compute_overview_is_bounded(self):
        """compute_overview must not issue per-entry or per-line queries."""
        from accounting_service import compute_overview
        with _CountContext():
            overview = compute_overview(self.session, self.business_id)
            q = _query_count()
        self.assertEqual(q, 1, f"compute_overview issued {q} queries; expected a single eager-load statement")
        self.assertGreater(overview["expenses"], 0)

    def test_period_totals_is_bounded(self):
        """get_period_totals must eager-load lines/accounts (1 query)."""
        from analytics_service import get_period_totals
        from financial_periods import default_period
        with _CountContext():
            totals = get_period_totals(self.session, self.business_id, default_period())
            q = _query_count()
        self.assertEqual(q, 1, f"get_period_totals issued {q} queries; expected 1 eager-load statement")
        self.assertEqual(totals.transaction_count, 200)

    def test_expense_breakdown_is_bounded(self):
        """get_expense_breakdown must eager-load (1 query), not 1 + N."""
        from analytics_service import get_expense_breakdown
        from financial_periods import default_period
        with _CountContext():
            breakdown = get_expense_breakdown(self.session, self.business_id, default_period())
            q = _query_count()
        self.assertEqual(q, 1, f"get_expense_breakdown issued {q} queries; expected 1")
        self.assertEqual(len(breakdown), 1)

    def test_account_balances_uses_aggregation_or_eagerload(self):
        """get_account_balances must not lazy-load per-line."""
        from analytics_service import get_account_balances
        with _CountContext():
            balances = get_account_balances(self.session, self.business_id)
            q = _query_count()
        self.assertLess(q, 20, f"get_account_balances issued {q} queries; N+1 regression")
        self.assertTrue(any(b.balance > 0 for b in balances))


if __name__ == "__main__":
    unittest.main()