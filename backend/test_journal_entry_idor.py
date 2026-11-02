"""Regression tests for cross-business journal-entry account injection (P0 IDOR).

Proves that POST /api/journal-entries rejects any journal line whose
account_id belongs to a business other than the caller-authorized target
business, that rejection leaves no partial ledger state, and that legitimate
entries using the caller's own accounts still succeed.

Uses an in-memory SQLite database injected via FastAPI dependency_overrides
so the suite runs without PostgreSQL, following the unittest + TestClient
conventions of test_api_flow.

Run:  python -m unittest test_journal_entry_idor
"""

import os
import unittest
import uuid
from decimal import Decimal

os.environ["OPENAI_API_KEY"] = "sk-test-placeholder"
os.environ["JWT_SECRET_KEY"] = "x" * 40


class JournalEntryIdorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool

        import models  # noqa: F401 — populate metadata
        from database import Base, get_db

        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(cls.engine)
        cls.session_factory = sessionmaker(bind=cls.engine, autoflush=False)

        def _test_get_db():
            db = cls.session_factory()
            try:
                yield db
            finally:
                db.close()

        import main as main_mod
        from fastapi.testclient import TestClient

        cls.app = main_mod.app
        cls.app.dependency_overrides[get_db] = _test_get_db
        cls.client = TestClient(cls.app)

    @classmethod
    def tearDownClass(cls):
        cls.app.dependency_overrides.clear()
        cls.engine.dispose()

    def setUp(self):
        # The in-memory rate limiter is process-global; clear it between tests
        # so signup/login limits don't accumulate across the suite (the 20/5-min
        # auth_login bucket is otherwise exhausted by earlier test files,
        # making test_login_after_signup_still_works fail with a 429).
        import rate_limiter

        rate_limiter._limiter._buckets.clear()
        rate_limiter._ai_limiter._burst_limiter._buckets.clear()
        rate_limiter._ai_limiter._sustained_limiter._buckets.clear()

    # ------------------------------------------------------------------ helpers

    def _signup(self):
        email = f"idor-{uuid.uuid4().hex[:10]}@example.com"
        r = self.client.post("/api/auth/signup", json={
            "email": email,
            "password": "RivaTest123",
            "business_name": f"Biz {uuid.uuid4().hex[:6]}",
            "base_currency": "IRR",
        })
        self.assertEqual(r.status_code, 201, r.text)
        body = r.json()
        return body["access_token"], body["business"]["id"]

    @staticmethod
    def _headers(token):
        return {"Authorization": f"Bearer {token}"}

    def _accounts(self, token, business_id):
        r = self.client.get(
            f"/api/businesses/{business_id}/accounts",
            headers=self._headers(token),
        )
        self.assertEqual(r.status_code, 200, r.text)
        return r.json()

    @staticmethod
    def _account_by_code(accounts, code):
        for account in accounts:
            if account.get("code") == code:
                return account["id"]
        raise AssertionError(f"account code {code} not found in {accounts}")

    def _journal_entry_count(self, business_id):
        from models import JournalEntry

        db = self.session_factory()
        try:
            return (
                db.query(JournalEntry)
                .filter(JournalEntry.business_id == business_id)
                .count()
            )
        finally:
            db.close()

    def _line_count_on_accounts(self, account_ids):
        from models import JournalLine

        db = self.session_factory()
        try:
            return (
                db.query(JournalLine)
                .filter(JournalLine.account_id.in_(account_ids))
                .count()
            )
        finally:
            db.close()

    def _post_entry(self, token, business_id, lines, description="test entry"):
        return self.client.post(
            "/api/journal-entries",
            headers=self._headers(token),
            json={
                "business_id": business_id,
                "description": description,
                "currency": "IRR",
                "lines": lines,
            },
        )

    # ------------------------------------------------------------------- tests

    def test_cross_business_account_injection_rejected_no_partial_writes(self):
        """Business A posting a line onto Business B's account must 400,
        create no journal entry, and leave B's accounts untouched."""
        token_a, biz_a = self._signup()
        token_b, biz_b = self._signup()

        accounts_a = self._accounts(token_a, biz_a)
        accounts_b = self._accounts(token_b, biz_b)
        cash_a = self._account_by_code(accounts_a, "1000")      # A's cash
        bank_b = self._account_by_code(accounts_b, "1010")      # B's bank

        # Precondition: neither business has ledger activity yet.
        self.assertEqual(self._journal_entry_count(biz_a), 0)
        self.assertEqual(self._journal_entry_count(biz_b), 0)

        response = self._post_entry(
            token_a,
            biz_a,
            lines=[
                {"account_id": cash_a, "debit": 100000, "credit": 0},
                {"account_id": bank_b, "debit": 0, "credit": 100000},
            ],
            description="cross-tenant injection attempt",
        )

        self.assertEqual(response.status_code, 400, response.text)
        self.assertIn("belong to this business", response.json()["detail"])

        # No partial ledger mutation anywhere.
        self.assertEqual(self._journal_entry_count(biz_a), 0)
        self.assertEqual(self._journal_entry_count(biz_b), 0)
        self.assertEqual(self._line_count_on_accounts([cash_a]), 0)
        self.assertEqual(self._line_count_on_accounts([bank_b]), 0)

        # B's balances still zero (nothing attached to any B account).
        refreshed_b = self._accounts(token_b, biz_b)
        for account in refreshed_b:
            self.assertEqual(
                Decimal(account["balance"]), Decimal("0"),
                f"B account {account['code']} balance changed",
            )

    def test_entry_targeting_another_business_outright_rejected(self):
        """Using B's business_id directly must 404 for user A (membership
        check) and must not touch B's ledger."""
        token_a, _biz_a = self._signup()
        token_b, biz_b = self._signup()
        accounts_b = self._accounts(token_b, biz_b)
        line_accounts = [a["id"] for a in accounts_b[:2]]

        response = self._post_entry(
            token_a,
            biz_b,
            lines=[
                {"account_id": line_accounts[0], "debit": 500, "credit": 0},
                {"account_id": line_accounts[1], "debit": 0, "credit": 500},
            ],
        )
        self.assertEqual(response.status_code, 404, response.text)
        self.assertEqual(self._journal_entry_count(biz_b), 0)

    def test_legitimate_entry_with_own_accounts_succeeds(self):
        """A balanced entry using only Business A's own accounts must be
        created in full (entry + both lines)."""
        token_a, biz_a = self._signup()
        accounts_a = self._accounts(token_a, biz_a)
        cash_a = self._account_by_code(accounts_a, "1000")
        sales_a = self._account_by_code(accounts_a, "4000")

        response = self._post_entry(
            token_a,
            biz_a,
            lines=[
                {"account_id": cash_a, "debit": 250000, "credit": 0},
                {"account_id": sales_a, "debit": 0, "credit": 250000},
            ],
            description="legit sale",
        )
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertIn("id", body)

        self.assertEqual(self._journal_entry_count(biz_a), 1)
        self.assertEqual(self._line_count_on_accounts([cash_a, sales_a]), 2)

    def test_requires_authentication(self):
        """Unauthenticated journal creation must 401 (dependency wired)."""
        token_a, biz_a = self._signup()
        accounts_a = self._accounts(token_a, biz_a)
        cash_a = self._account_by_code(accounts_a, "1000")
        sales_a = self._account_by_code(accounts_a, "4000")

        response = self.client.post(
            "/api/journal-entries",
            json={
                "business_id": biz_a,
                "description": "no auth",
                "currency": "IRR",
                "lines": [
                    {"account_id": cash_a, "debit": 1, "credit": 0},
                    {"account_id": sales_a, "debit": 0, "credit": 1},
                ],
            },
        )
        self.assertEqual(response.status_code, 401, response.text)

    def test_login_after_signup_still_works(self):
        """Login must issue tokens (regression for the refresh-token JTI
        UnboundLocalError that made every login return 500)."""
        email = f"login-{uuid.uuid4().hex[:10]}@example.com"
        signup = self.client.post("/api/auth/signup", json={
            "email": email,
            "password": "RivaTest123",
            "business_name": f"Biz {uuid.uuid4().hex[:6]}",
            "base_currency": "IRR",
        })
        self.assertEqual(signup.status_code, 201, signup.text)

        login = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": "RivaTest123"},
        )
        self.assertEqual(login.status_code, 200, login.text)
        body = login.json()
        self.assertIn("access_token", body)

        # The issued access token must resolve an authenticated request.
        me = self.client.get(
            "/api/auth/me", headers=self._headers(body["access_token"])
        )
        self.assertEqual(me.status_code, 200, me.text)


if __name__ == "__main__":
    unittest.main()
