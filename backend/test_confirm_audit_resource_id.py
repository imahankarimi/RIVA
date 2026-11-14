"""Regression test for audit_logs.resource_id overflow on multi-transaction confirm.

Historically, POST /api/chat/confirm audited a batch confirmation with a single
audit row whose resource_id was the comma-joined list of created journal-entry
IDs ("uuid,uuid" = 73 chars). audit_logs.resource_id is varchar(36) — sized for
one resource ID — so every multi-transaction confirm aborted with
psycopg.errors.StringDataRightTruncation (value too long for type character
varying(36)) AFTER the journal entries had been committed.

The fix writes one audit row per created journal entry (resource_id = a single
36-char entry ID) while preserving the batch summary (count, descriptions and
the complete ID list) in new_value.

This test runs against the dedicated PostgreSQL test database provided by
test_support (TEST_DATABASE_URL, e.g. ledgerai_test) — never against the
application's DATABASE_URL. It must run on real PostgreSQL because SQLite
does not enforce VARCHAR lengths and would not reproduce the truncation
error; the test fails loudly if it is ever pointed at a non-PostgreSQL
database.

Run:  python -m pytest -q test_confirm_audit_resource_id.py
"""

import json
import os
import unittest
import uuid
from unittest.mock import patch

os.environ["OPENAI_API_KEY"] = "sk-test"
os.environ["JWT_SECRET_KEY"] = "x" * 40


def _record_transactions_provider(messages, **kwargs):
    """Emits the record_transactions tool call for transaction requests."""
    last = [m for m in messages if m["role"] == "user"][-1]["content"]
    if "earned" in last or "spent" in last:
        return {
            "content": "",
            "tool_calls": [
                {
                    "id": "call_1",
                    "type": "function",
                    "function": {
                        "name": "record_transactions",
                        "arguments": json.dumps({
                            "transactions": [
                                {"intent": "income", "amount": 2500, "description": "weekly earnings"},
                                {"intent": "expense", "amount": 463, "description": "electricity bill for cafe"},
                            ]
                        }),
                    },
                }
            ],
            "finish_reason": "tool_calls",
        }
    return {"content": "Done.", "tool_calls": None}


class ConfirmAuditResourceIdTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Dedicated PostgreSQL test database (TEST_DATABASE_URL), isolated
        # from the application's DATABASE_URL database; schema recreated per
        # run so the test is repeatable and independent of other runs.
        from database import get_db
        from fastapi.testclient import TestClient

        from test_support import install_test_database, make_get_db_override

        cls.engine, cls.session_factory = install_test_database()
        import main as main_mod

        main_mod.app.dependency_overrides[get_db] = make_get_db_override(cls.session_factory)
        cls.app = main_mod.app
        cls.client = TestClient(cls.app)
        # Unique email so the test is re-runnable against the shared DB.
        email = f"cbar-{os.urandom(4).hex()}@example.com"
        signup = cls.client.post("/api/auth/signup", json={
            "email": email,
            "password": "RivaTest123",
            "business_name": "Cafe Shop",
            "base_currency": "USD",
        })
        cls.token = signup.json()["access_token"]
        cls.biz = signup.json()["business"]["id"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    @classmethod
    def tearDownClass(cls):
        import main as main_mod
        from database import get_db

        from test_support import teardown_test_database

        main_mod.app.dependency_overrides.pop(get_db, None)
        teardown_test_database(cls.engine)

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_multi_confirm_writes_one_audit_row_per_entry(self, _mock):
        from models import AuditLog

        # This regression MUST run on PostgreSQL: only Postgres enforces
        # varchar(36) and would reproduce the original StringDataRightTruncation.
        # A non-PostgreSQL dialect fails the test (never silently skips it).
        self.assertEqual(
            self.engine.dialect.name, "postgresql",
            "test_confirm_audit_resource_id requires a PostgreSQL test "
            f"database (TEST_DATABASE_URL); got {self.engine.dialect.name!r}.",
        )

        d = self.client.post("/api/chat", headers=self.headers, json={
            "business_id": self.biz,
            "message": "earned 2500 dollars and spent 463 for electricity",
        }).json()
        self.assertEqual(d["type"], "confirmation_required")
        self.assertEqual(len(d["transactions"]), 2)

        body = self.client.post("/api/chat/confirm", headers=self.headers, json={
            "business_id": self.biz,
            "conversation_id": d["conversation_id"],
            "transactions": d["transactions"],
        }).json()
        self.assertTrue(body["success"], body)
        created_ids = body["transaction_ids"]
        self.assertEqual(len(created_ids), 2)

        # The audit trail must record the confirmation without any value
        # overflowing audit_logs.resource_id (varchar(36)).
        # Read back through the TEST database session (the same database the
        # app wrote to via the get_db override) — never database.SessionLocal,
        # which is bound to the application's DATABASE_URL engine.
        db = self.session_factory()
        try:
            rows = (
                db.query(AuditLog)
                .filter(
                    AuditLog.business_id == self.biz,
                    AuditLog.action == "transaction_confirm",
                    AuditLog.resource_type == "transaction",
                )
                .all()
            )

            # One row per created journal entry — never a comma-joined list.
            self.assertEqual(len(rows), len(created_ids))
            for row in rows:
                self.assertEqual(len(row.resource_id), 36)
                self.assertNotIn(",", row.resource_id)
                self.assertIn(row.resource_id, created_ids)
                # A complete, valid UUID — not a truncated fragment.
                self.assertEqual(str(uuid.UUID(row.resource_id)), row.resource_id)

            # Every created entry is covered exactly once: no ID truncated
            # or dropped from the audit trail.
            self.assertEqual(
                sorted(row.resource_id for row in rows),
                sorted(created_ids),
            )

            # The batch summary (count + full ID list + descriptions) is
            # preserved on the audit rows — no metadata discarded.
            for row in rows:
                payload = json.loads(row.new_value)
                self.assertEqual(payload["count"], len(created_ids))
                self.assertEqual(payload["ids"], created_ids)
                self.assertEqual(
                    payload["descriptions"],
                    ["weekly earnings", "electricity bill for cafe"],
                )
        finally:
            db.close()


    def _signup(self, label):
        email = f"{label}-{os.urandom(4).hex()}@example.com"
        r = self.client.post("/api/auth/signup", json={
            "email": email,
            "password": "RivaTest123",
            "business_name": f"{label} shop",
            "base_currency": "USD",
        })
        self.assertEqual(r.status_code, 201, r.text)
        body = r.json()
        return {"Authorization": f"Bearer {body['access_token']}"}, body["business"]["id"]

    def test_single_confirm_creates_one_entry_and_one_audit(self):
        from models import AuditLog, JournalEntry

        headers, biz = self._signup("single")
        accounts = self.client.get(
            f"/api/businesses/{biz}/accounts", headers=headers
        ).json()
        by_name = {a["name"]: a["id"] for a in accounts}

        body = self.client.post("/api/chat/confirm", headers=headers, json={
            "business_id": biz,
            "conversation_id": None,
            "transactions": [{
                "intent": "income",
                "amount": 2500,
                "description": "weekly earnings",
                "debit_account_id": by_name["Bank"],
                "credit_account_id": by_name["Sales Revenue"],
                "currency": "USD",
            }],
        }).json()

        # Response format/message unchanged.
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Transaction recorded successfully.")
        self.assertEqual(len(body["transaction_ids"]), 1)
        entry_id = body["transaction_ids"][0]

        db = self.session_factory()
        try:
            self.assertEqual(
                db.query(JournalEntry).filter(JournalEntry.business_id == biz).count(), 1
            )
            rows = (
                db.query(AuditLog)
                .filter(
                    AuditLog.business_id == biz,
                    AuditLog.action == "transaction_confirm",
                )
                .all()
            )
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0].resource_id, entry_id)
            payload = json.loads(rows[0].new_value)
            self.assertEqual(payload["count"], 1)
            self.assertEqual(payload["ids"], [entry_id])
        finally:
            db.close()

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_audit_failure_rolls_back_entire_confirmation(self, _mock_ai):
        """A failing audit insert must leave NO journal entries behind."""
        import main as main_mod
        from fastapi.testclient import TestClient

        from models import AuditLog, ChatMessageRow, JournalEntry

        headers, biz = self._signup("rollback")
        preview = self.client.post("/api/chat", headers=headers, json={
            "business_id": biz,
            "message": "earned 2500 dollars and spent 463 for electricity",
            "conversation_id": None,
        }).json()
        self.assertEqual(preview["type"], "confirmation_required")
        self.assertEqual(len(preview["transactions"]), 2)
        conv = preview["conversation_id"]

        real_audit = main_mod._audit_log
        calls = {"n": 0}

        def flaky_audit(*args, **kwargs):
            calls["n"] += 1
            if calls["n"] >= 2:
                # Fail after the first audit row was already added/flushed:
                # the whole transaction must still roll back.
                raise RuntimeError("simulated audit persistence failure")
            return real_audit(*args, **kwargs)

        failing_client = TestClient(self.app, raise_server_exceptions=False)
        with patch.object(main_mod, "_audit_log", flaky_audit):
            r = failing_client.post("/api/chat/confirm", headers=headers, json={
                "business_id": biz,
                "conversation_id": conv,
                "transactions": preview["transactions"],
            })
        self.assertEqual(r.status_code, 500)

        db = self.session_factory()
        try:
            self.assertEqual(
                db.query(JournalEntry).filter(JournalEntry.business_id == biz).count(),
                0,
                "journal entries were committed despite the audit failure",
            )
            self.assertEqual(
                db.query(AuditLog)
                .filter(
                    AuditLog.business_id == biz,
                    AuditLog.action == "transaction_confirm",
                )
                .count(),
                0,
            )
            self.assertEqual(
                db.query(ChatMessageRow)
                .filter(
                    ChatMessageRow.conversation_id == conv,
                    ChatMessageRow.msg_type == "success",
                )
                .count(),
                0,
            )
        finally:
            db.close()

    def test_second_entry_value_error_rolls_back_first_entry(self):
        """Entry 1 succeeds, entry 2 raises ValueError → nothing survives.

        Regression for the deferred-commit confirm flow: the first entry is
        flushed into the route's transaction, then the second action fails
        validation. The ValueError handler must roll back the first entry
        BEFORE committing the conversation error message, otherwise that
        commit would persist a partial financial confirmation.
        """
        import main as main_mod
        from models import AuditLog, ChatMessageRow, JournalEntry

        headers, biz = self._signup("valueerror")
        accounts = self.client.get(
            f"/api/businesses/{biz}/accounts", headers=headers
        ).json()
        by_name = {a["name"]: a["id"] for a in accounts}
        conv = self.client.post(
            f"/api/businesses/{biz}/conversations", headers=headers
        ).json()["id"]

        good = {
            "intent": "income",
            "amount": 2500,
            "description": "weekly earnings",
            "debit_account_id": by_name["Bank"],
            "credit_account_id": by_name["Sales Revenue"],
            "currency": "USD",
        }
        # Passes shape validation, then fails inside validate_accounting_action
        # ("Invalid debit account.") with ValueError — i.e. a ValueError, not
        # an audit/database failure.
        bad = {
            "intent": "expense",
            "amount": 120,
            "description": "broken second entry",
            "debit_account_id": "00000000-0000-0000-0000-000000000000",
            "credit_account_id": by_name["Cash"],
            "currency": "USD",
        }

        real_create = main_mod.create_journal_entry
        created = {"n": 0}

        def counting_create(*args, **kwargs):
            entry = real_create(*args, **kwargs)
            created["n"] += 1
            return entry

        with patch.object(main_mod, "create_journal_entry", counting_create):
            r = self.client.post("/api/chat/confirm", headers=headers, json={
                "business_id": biz,
                "conversation_id": conv,
                "transactions": [good, bad],
            })

        # The first entry really was created successfully before entry 2 failed.
        self.assertEqual(
            created["n"], 1,
            "test did not exercise 'first entry succeeds, second fails'",
        )
        # Existing API contract/message preserved.
        self.assertEqual(r.status_code, 400, r.text)
        self.assertIn("Invalid debit account", r.json()["detail"])

        db = self.session_factory()
        try:
            self.assertEqual(
                db.query(JournalEntry)
                .filter(JournalEntry.business_id == biz)
                .count(),
                0,
                "the first entry from the failed batch was committed",
            )
            self.assertEqual(
                db.query(AuditLog)
                .filter(
                    AuditLog.business_id == biz,
                    AuditLog.action == "transaction_confirm",
                )
                .count(),
                0,
                "audit rows from the failed batch were persisted",
            )
            # Existing behaviour: the localized error is still recorded, and
            # no success message exists.
            self.assertEqual(
                db.query(ChatMessageRow)
                .filter(
                    ChatMessageRow.conversation_id == conv,
                    ChatMessageRow.msg_type == "error",
                )
                .count(),
                1,
            )
            self.assertEqual(
                db.query(ChatMessageRow)
                .filter(
                    ChatMessageRow.conversation_id == conv,
                    ChatMessageRow.msg_type == "success",
                )
                .count(),
                0,
            )
        finally:
            db.close()

    def test_non_financial_audit_calls_still_persist(self):
        """Default _audit_log(commit=True) behaviour is unchanged elsewhere."""
        from models import AuditLog

        headers, biz = self._signup("default-audit")
        r = self.client.patch(f"/api/businesses/{biz}", headers=headers, json={
            "name": "Renamed Shop",
        })
        self.assertEqual(r.status_code, 200, r.text)

        db = self.session_factory()
        try:
            row = (
                db.query(AuditLog)
                .filter(
                    AuditLog.action == "business_update",
                    AuditLog.resource_id == biz,
                )
                .first()
            )
            self.assertIsNotNone(row)
            self.assertEqual(row.business_id, biz)
            self.assertEqual(json.loads(row.new_value)["name"], "Renamed Shop")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
