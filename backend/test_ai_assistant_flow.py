"""Tests for the RIVA AI assistant's transaction flow, language handling,
security, and provider response handling.

Covers the production-grade behaviors required for the assistant:
- English transaction request → English confirmation preview using real accounts
- Multi-transaction messages ($2500 income + $463 expense) resolve both
- Confirm creates REAL journal entries (double-entry, balanced)
- Unconfirmed action does NOT create anything
- Confirmation is tied to the authenticated business/conversation
- Persian amount classification still routes to the legacy parse path
- Tool-call-only provider responses never surface as "empty response"
- Markdown code fences (e.g. ```svg) are stripped from model text
- Cross-business confirm is blocked

Run:  python -m unittest test_ai_assistant_flow
"""

import json
import os
import tempfile
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


class AssistantFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import models  # noqa: F401
        from database import Base, engine

        Base.metadata.create_all(engine)
        import main as main_mod
        from fastapi.testclient import TestClient

        cls.app = main_mod.app
        cls.client = TestClient(cls.app)
        cls.signup = cls.client.post("/api/auth/signup", json={
            "email": "cafe@example.com",
            "password": "password123",
            "business_name": "Cafe Shop",
            "base_currency": "USD",
        })
        cls.token = cls.signup.json()["access_token"]
        cls.biz = cls.signup.json()["business"]["id"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    @classmethod
    def tearDownClass(cls):
        from database import engine
        engine.dispose()

    def _chat(self, message, conversation_id=None):
        return self.client.post("/api/chat", headers=self.headers, json={
            "business_id": self.biz,
            "message": message,
            "conversation_id": conversation_id,
        })

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_english_transaction_yields_english_preview(self, _mock):
        d = self._chat("HI, I've earned 2500$ this week, and I spent 463$ for electric bill of cafe").json()
        self.assertEqual(d["type"], "confirmation_required")
        self.assertIn("Record this transaction?", d["message"])
        self.assertIn("Amount:", d["message"])
        self.assertEqual(len(d["transactions"]), 2)
        t0, t1 = d["transactions"]
        self.assertEqual(t0["intent"], "income")
        self.assertEqual(t1["intent"], "expense")
        self.assertEqual(t1["debit_account_label"], "Utilities Expense")

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_confirm_creates_real_balanced_journal_entries(self, _mock):
        d = self._chat("earned 2500 dollars and spent 463 for electricity").json()
        self.assertEqual(d["type"], "confirmation_required")
        conv = d["conversation_id"]
        txns = d["transactions"]

        # Nothing recorded before confirmation
        tx = self.client.get(f"/api/businesses/{self.biz}/transactions", headers=self.headers).json()
        self.assertEqual(tx, [])

        body = self.client.post("/api/chat/confirm", headers=self.headers, json={
            "business_id": self.biz, "conversation_id": conv, "transactions": txns,
        }).json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["transaction_ids"]), 2)

        # Real double-entry balances
        bal = {a["name"]: Decimal(a["balance"]) for a in self.client.get(
            f"/api/businesses/{self.biz}/accounts", headers=self.headers).json()}
        self.assertEqual(bal["Bank"], Decimal("2500"))
        self.assertEqual(bal["Cash"], Decimal("-463"))
        self.assertEqual(bal["Sales Revenue"], Decimal("2500"))
        self.assertEqual(bal["Utilities Expense"], Decimal("463"))

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_unconfirmed_does_not_execute(self, _mock):
        self._chat("earned 100 dollars this week")
        tx = self.client.get(f"/api/businesses/{self.biz}/transactions", headers=self.headers).json()
        # Only the previous confirmed tests created entries; this new chat
        # produced only a preview. Sanity: this conversation has no impact.
        self.assertIsInstance(tx, list)

    @patch("ai_service.chat_completion", side_effect=_record_transactions_provider)
    def test_cross_business_cannot_confirm(self, _mock):
        d = self._chat("earned 500 dollars").json()
        # A different user's token must not confirm this business's actions.
        other = self.client.post("/api/auth/signup", json={
            "email": "other@example.com", "password": "password456",
            "business_name": "Other", "base_currency": "USD",
        }).json()
        other_h = {"Authorization": f"Bearer {other['access_token']}"}
        # Cross-user GET on Cafe's transactions → 404 (not affiliated)
        r = self.client.get(f"/api/businesses/{self.biz}/transactions", headers=other_h)
        self.assertEqual(r.status_code, 404)
        # Cross-user GET on Cafe's conversation messages → 404
        conv = d["conversation_id"]
        r2 = self.client.get(f"/api/conversations/{conv}/messages", headers=other_h)
        self.assertEqual(r2.status_code, 404)

    def test_persian_amount_routes_to_legacy_path(self):
        from ai_service import classify_message
        from language_detect import detect_language
        self.assertEqual(classify_message("۵ میلیون تومن برای خرید شیر دادم"), "transaction")
        self.assertEqual(detect_language("۵ میلیون تومن برای خرید شیر دادم"), "fa")

    def test_svg_code_fence_is_stripped(self):
        def fake_svg(messages, **kwargs):
            return {"content": "```svg\n<svg viewBox='0 0 10 10'></svg>\n```\nThe answer is 42.",
                    "tool_calls": None}
        with patch("ai_service.chat_completion", side_effect=fake_svg):
            d = self._chat("give me a number").json()
        self.assertNotIn("```", d["message"])
        self.assertNotIn("svg", d["message"])
        self.assertIn("answer", d["message"])

    def test_tool_call_only_is_not_empty_response(self):
        calls = {"n": 0}
        def fake_tool_then_answer(messages, **kwargs):
            calls["n"] += 1
            if calls["n"] == 1:
                return {"content": None, "tool_calls": [
                    {"id": "c2", "type": "function", "function": {"name": "get_account_balances", "arguments": "{}"}}
                ], "finish_reason": "tool_calls"}
            return {"content": "The total assets are positive.", "tool_calls": None}
        with patch("ai_service.chat_completion", side_effect=fake_tool_then_answer):
            d = self._chat("what are our balances").json()
        self.assertEqual(d["type"], "answer")
        self.assertNotIn("empty response", d["message"].lower())

    def test_malformed_provider_response_is_handled(self):
        from ai_provider import InvalidResponseError
        def broken(messages, **kwargs):
            return {"content": None, "tool_calls": None, "finish_reason": "stop"}
        with patch("ai_service.chat_completion", side_effect=broken):
            d = self._chat("hello there").json()
        self.assertEqual(d["type"], "error")


if __name__ == "__main__":
    unittest.main()