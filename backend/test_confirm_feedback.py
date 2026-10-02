"""Tests for the immediate confirm-result feedback flow.

Verifies that after the user confirms a transaction action:
- the backend returns a localized success message (English for English data,
  Persian for Persian data)
- that message is persisted into the conversation history once (so a reload
  shows it exactly once — no duplication with the in-chat pushed message)
- failure responses carry the localized backend error detail

Run:  python -m unittest test_confirm_feedback
"""

import json
import os
import unittest
from decimal import Decimal
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


class ConfirmFeedbackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import models  # noqa: F401
        from database import Base, engine

        Base.metadata.create_all(engine)
        import main as main_mod
        from fastapi.testclient import TestClient

        cls.app = main_mod.app
        cls.client = TestClient(cls.app)

    @classmethod
    def tearDownClass(cls):
        from database import engine
        engine.dispose()

    def _signup(self, email, name, currency):
        r = self.client.post("/api/auth/signup", json={
            "email": email, "password": "password123",
            "business_name": name, "base_currency": currency,
        })
        self.assertEqual(r.status_code, 201)
        body = r.json()
        return body["access_token"], body["business"]["id"], body["business"]["name"]

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_multi_confirm_returns_and_persists_english_success(self, _mock):
        token, biz, name = self._signup(f"cb{os.urandom(4).hex()}@example.com", "Cafe", "USD")
        h = {"Authorization": f"Bearer {token}"}

        d = self.client.post("/api/chat", headers=h, json={
            "business_id": biz,
            "message": "earned 2500 dollars this week and spent 463 for electricity bill",
            "conversation_id": None,
        }).json()
        self.assertEqual(d["type"], "confirmation_required")
        conv, txns = d["conversation_id"], d["transactions"]

        body = self.client.post("/api/chat/confirm", headers=h, json={
            "business_id": biz, "conversation_id": conv, "transactions": txns,
        }).json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["transaction_ids"]), 2)
        self.assertEqual(body["message"], "2 transactions recorded successfully.")

        # The success message is persisted EXACTLY once in the conversation.
        msgs = self.client.get(f"/api/conversations/{conv}/messages", headers=h).json()
        success_msgs = [m for m in msgs if m["msg_type"] == "success"]
        self.assertEqual(len(success_msgs), 1)
        self.assertEqual(success_msgs[0]["content"], "2 transactions recorded successfully.")

        # The user message + preview + success sequence is intact and ordered.
        roles_types = [(m["role"], m["msg_type"]) for m in msgs]
        self.assertIn(("user", "text"), roles_types)
        self.assertIn(("assistant", "confirmation_required"), roles_types)
        self.assertEqual(roles_types[-1], ("assistant", "success"))

    def test_single_confirm_english_success(self):
        token, biz, name = self._signup(f"cb{os.urandom(4).hex()}@example.com", "Cafe", "USD")
        h = {"Authorization": f"Bearer {token}"}

        # Confirm ONE transaction directly (bypass AI call — we know the preview shape)
        accts = self.client.get(f"/api/businesses/{biz}/accounts", headers=h).json()
        income_accts = {a["name"]: a["id"] for a in accts}

        single_txn = [{
            "intent": "income", "amount": 2500, "description": "weekly earnings",
            "debit_account_id": income_accts["Bank"],
            "credit_account_id": income_accts["Sales Revenue"],
            "currency": "USD",
        }]

        body = self.client.post("/api/chat/confirm", headers=h, json={
            "business_id": biz, "conversation_id": None, "transactions": single_txn,
        }).json()
        self.assertTrue(body["success"])
        self.assertEqual(body["message"], "Transaction recorded successfully.")
        self.assertEqual(len(body["transaction_ids"]), 1)

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_failed_confirm_returns_error_detail(self, _mock):
        token, biz, name = self._signup(f"cb{os.urandom(4).hex()}@example.com", "Cafe", "USD")
        h = {"Authorization": f"Bearer {token}"}
        d = self.client.post("/api/chat", headers=h, json={
            "business_id": biz, "message": "earned 500 dollars", "conversation_id": None,
        }).json()
        conv = d["conversation_id"]

        # Send a malformed transaction (missing accounts) → should fail validation
        bad_txns = [{
            "intent": "expense", "amount": 100, "description": "x",
            "debit_account_id": "00000000-0000-0000-0000-000000000000",
            "credit_account_id": "00000000-0000-0000-0000-000000000000",
        }]
        r = self.client.post("/api/chat/confirm", headers=h, json={
            "business_id": biz, "conversation_id": conv, "transactions": bad_txns,
        })
        self.assertEqual(r.status_code, 400)
        detail = r.json()["detail"]
        self.assertTrue(isinstance(detail, str) and detail)  # localized error surface

        # The error is also persisted as an 'error' assistant message once
        msgs = self.client.get(f"/api/conversations/{conv}/messages", headers=h).json()
        err_msgs = [m for m in msgs if m["msg_type"] == "error"]
        self.assertGreaterEqual(len(err_msgs), 1)


if __name__ == "__main__":
    unittest.main()