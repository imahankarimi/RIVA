"""End-to-end API tests for the RIVA AI assistant flow.

Runs the real FastAPI app (TestClient) against a temp-file SQLite database
with the AI provider mocked, so no external service or PostgreSQL is needed.
Verifies acceptance equivalents of:

- New Chat creates an empty conversation
- Messages persist and reload correctly (refresh)
- Multi-turn questions stay in the same conversation
- Conversations are isolated (no cross-conversation leakage)
- Cross-business access is blocked (authorization)
- Conversation deletion works
- First-message auto-titling

Run:  python -m unittest test_api_flow
"""

import os
import uuid
import unittest
from unittest.mock import patch

os.environ["OPENAI_API_KEY"] = "sk-test-placeholder"
os.environ["JWT_SECRET_KEY"] = "x" * 40


def _fake_ai(messages, **kwargs):
    """A cheap stand-in for the chat_completion call."""
    last = [m for m in messages if m["role"] == "user"][-1]["content"]
    if "How much did we spend" in last:
        return {"content": "Your expenses were 500,000 IRR in the last month.", "tool_calls": None}
    if "balance" in last.lower():
        return {"content": "Your total balance is 700,000 IRR.", "tool_calls": None}
    return {"content": "Understood.", "tool_calls": None}


class ApiFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import models  # noqa: F401  — populate metadata
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

    def setUp(self):
        self.signup_biz = "My Shop"
        # Unique email per test so multiple tests can share the app/DB.
        self.email = f"owner-{uuid.uuid4().hex[:8]}@example.com"
        r = self.client.post("/api/auth/signup", json={
            "email": self.email,
            "password": "password123",
            "business_name": self.signup_biz,
            "base_currency": "IRR",
        })
        self.assertEqual(r.status_code, 201)
        body = r.json()
        self.token = body["access_token"]
        self.biz_id = body["business"]["id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def _new_conversation(self):
        r = self.client.post(f"/api/businesses/{self.biz_id}/conversations", headers=self.headers)
        self.assertEqual(r.status_code, 201)
        return r.json()["id"]

    def test_new_chat_creates_empty_conversation(self):
        conv = self._new_conversation()
        r = self.client.get(f"/api/conversations/{conv}/messages", headers=self.headers)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), [])

    @patch("ai_service.chat_completion", side_effect=_fake_ai)
    def test_messages_persist_and_conversation_auto_titles(self, _mock):
        conv = self._new_conversation()
        r = self.client.post("/api/chat", headers=self.headers, json={
            "business_id": self.biz_id,
            "message": "How much did we spend on marketing last month?",
            "conversation_id": conv,
        })
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["conversation_id"], conv)
        self.assertEqual(r.json()["type"], "answer")

        r = self.client.get(f"/api/conversations/{conv}/messages", headers=self.headers)
        msgs = r.json()
        self.assertEqual(len(msgs), 2)
        self.assertEqual(msgs[0]["role"], "user")
        self.assertEqual(msgs[1]["role"], "assistant")

        convs = self.client.get(f"/api/businesses/{self.biz_id}/conversations", headers=self.headers).json()
        titled = [c for c in convs if c["id"] == conv][0]
        self.assertEqual(titled["title"], "How much did we spend on marketing last month?")

    @patch("ai_service.chat_completion", side_effect=_fake_ai)
    def test_multiturn_and_refresh_persistence(self, _mock):
        conv = self._new_conversation()
        q1 = {"business_id": self.biz_id, "conversation_id": conv,
              "message": "How much did we spend last month?"}
        q2 = {"business_id": self.biz_id, "conversation_id": conv,
              "message": "What is our balance?"}
        for q in (q1, q2):
            r = self.client.post("/api/chat", headers=self.headers, json=q)
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json()["conversation_id"], conv)

        # All 4 messages survived (2 user + 2 assistant)
        msgs = self.client.get(f"/api/conversations/{conv}/messages", headers=self.headers).json()
        self.assertEqual(len(msgs), 4)

    @patch("ai_service.chat_completion", side_effect=_fake_ai)
    def test_conversations_are_isolated(self, _mock):
        conv1 = self._new_conversation()
        conv2 = self._new_conversation()
        self.client.post("/api/chat", headers=self.headers, json={
            "business_id": self.biz_id, "conversation_id": conv1,
            "message": "How much did we spend on marketing last month?",
        })
        # conv2 must stay empty
        msgs2 = self.client.get(f"/api/conversations/{conv2}/messages", headers=self.headers).json()
        self.assertEqual(msgs2, [])
        # conv1 has 2 messages
        msgs1 = self.client.get(f"/api/conversations/{conv1}/messages", headers=self.headers).json()
        self.assertEqual(len(msgs1), 2)

    def test_cross_business_access_denied(self):
        conv1 = self._new_conversation()
        r = self.client.post("/api/auth/signup", json={
            "email": f"other-{uuid.uuid4().hex[:8]}@example.com",
            "password": "password456",
            "business_name": "Other Biz",
            "base_currency": "USD",
        })
        other_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = self.client.get(f"/api/conversations/{conv1}/messages", headers=other_headers)
        self.assertEqual(r.status_code, 404)

    def test_delete_conversation(self):
        conv = self._new_conversation()
        r = self.client.delete(f"/api/conversations/{conv}", headers=self.headers)
        self.assertEqual(r.status_code, 204)
        r = self.client.get(f"/api/conversations/{conv}/messages", headers=self.headers)
        self.assertEqual(r.status_code, 404)


if __name__ == "__main__":
    unittest.main()