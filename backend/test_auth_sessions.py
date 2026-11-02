"""Phase 2A regression tests: refresh tokens, rotation, replay, sessions, logout.

Covers the mandated security properties:
- login issues access + refresh credentials bound to a server-side session
- access and refresh tokens are mutually non-interchangeable (separate keys)
- refresh requires no access token, rotates, and rejects reuse (family revocation)
- logout revokes the session server-side; refresh after logout fails
- expired refresh tokens and expired DB sessions are rejected
- independent sessions for one user revoke independently

Uses the established pattern (TestClient + get_db dependency override +
in-memory SQLite) so it runs without PostgreSQL.

Run:  python -m unittest test_auth_sessions
"""

import os
import unittest
import uuid
from datetime import datetime, timedelta, timezone

os.environ["OPENAI_API_KEY"] = "sk-test-placeholder"
os.environ["JWT_SECRET_KEY"] = "x" * 40
# Deliberately unset: exercises the HMAC-derived refresh key path.
os.environ.pop("JWT_REFRESH_SECRET_KEY", None)

import jwt  # noqa: E402


class RefreshSessionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool

        import models  # noqa: F401
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
        cls.main = main_mod

        # One signup for the whole class (keeps under the signup rate limit).
        cls.email = f"session-{uuid.uuid4().hex[:10]}@example.com"
        r = cls.client.post("/api/auth/signup", json={
            "email": cls.email,
            "password": "RivaTest123",
            "business_name": f"Biz {uuid.uuid4().hex[:6]}",
            "base_currency": "IRR",
        })
        assert r.status_code == 201, r.text
        cls.signup_body = r.json()

    @classmethod
    def tearDownClass(cls):
        cls.app.dependency_overrides.clear()
        cls.engine.dispose()

    # ---------------------------------------------------------------- helpers

    def _login(self) -> dict:
        r = self.client.post(
            "/api/auth/login",
            json={"email": self.email, "password": "RivaTest123"},
        )
        self.assertEqual(r.status_code, 200, r.text)
        return r.json()

    @staticmethod
    def _headers(token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}

    def _me(self, token: str):
        return self.client.get("/api/auth/me", headers=self._headers(token))

    def _refresh(self, refresh_token: str, headers: dict | None = None):
        return self.client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
            headers=headers or {},
        )

    def _session_row(self, access_token: str):
        import auth as auth_mod
        from models import UserSession

        payload = jwt.decode(
            access_token, auth_mod._jwt_secret(), algorithms=[auth_mod.JWT_ALGORITHM]
        )
        sid = payload["sid"]
        db = self.session_factory()
        try:
            return db.query(UserSession).filter(UserSession.id == sid).first()
        finally:
            db.close()

    def _update_session(self, sid: str, **changes) -> None:
        from models import UserSession

        db = self.session_factory()
        try:
            row = db.query(UserSession).filter(UserSession.id == sid).first()
            assert row is not None
            for key, value in changes.items():
                setattr(row, key, value)
            db.commit()
        finally:
            db.close()

    def _sid(self, access_token: str) -> str:
        import auth as auth_mod

        payload = jwt.decode(
            access_token, auth_mod._jwt_secret(), algorithms=[auth_mod.JWT_ALGORITHM]
        )
        return payload["sid"]

    # ------------------------------------------------------------------ tests

    def test_01_login_returns_access_and_refresh_credentials(self):
        body = self._login()
        self.assertIn("access_token", body)
        self.assertIn("refresh_token", body)
        self.assertEqual(body["token_type"], "bearer")
        self.assertGreater(body["expires_in"], 0)
        self.assertGreater(body["refresh_expires_in"], 0)
        # The session is server-side and real.
        session = self._session_row(body["access_token"])
        self.assertIsNotNone(session)
        self.assertIsNone(session.revoked_at)

    def test_01b_signup_returns_refresh_credentials(self):
        self.assertIn("refresh_token", self.signup_body)
        self.assertGreater(self.signup_body["expires_in"], 0)

    def test_02_access_token_works_on_authenticated_endpoint(self):
        body = self._login()
        r = self._me(body["access_token"])
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["email"], self.email)

    def test_03_refresh_token_rejected_as_api_bearer(self):
        body = self._login()
        r = self._me(body["refresh_token"])
        self.assertEqual(r.status_code, 401, r.text)

    def test_04_access_token_rejected_at_refresh_endpoint(self):
        body = self._login()
        r = self._refresh(body["access_token"])
        self.assertEqual(r.status_code, 401, r.text)

    def test_04b_separate_signing_secrets(self):
        """A token signed with the wrong key must never validate."""
        import auth as auth_mod

        body = self._login()
        now = datetime.now(timezone.utc)
        # Refresh-shaped token signed with the ACCESS key → refresh rejects.
        forged_refresh = jwt.encode(
            {
                "sub": "x", "iat": now, "exp": now + timedelta(minutes=5),
                "type": "refresh", "jti": "a" * 32, "sid": "b" * 36,
            },
            auth_mod._jwt_secret(), algorithm=auth_mod.JWT_ALGORITHM,
        )
        self.assertEqual(self._refresh(forged_refresh).status_code, 401)

        # Access-shaped token signed with the REFRESH key → API rejects.
        forged_access = jwt.encode(
            {
                "sub": "x", "iat": now, "exp": now + timedelta(minutes=5),
                "type": "access",
            },
            auth_mod._refresh_jwt_secret(), algorithm=auth_mod.JWT_ALGORITHM,
        )
        self.assertEqual(self._me(forged_access).status_code, 401)

    def test_05_valid_refresh_returns_new_access_token(self):
        body = self._login()
        r = self._refresh(body["refresh_token"])
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        # New access token authenticates.
        self.assertEqual(self._me(data["access_token"]).status_code, 200)

    def test_06_refresh_rotates_the_refresh_token(self):
        body = self._login()
        first = self._refresh(body["refresh_token"]).json()
        self.assertNotEqual(first["refresh_token"], body["refresh_token"])
        # The rotated token is itself usable (chain continues).
        second = self._refresh(first["refresh_token"])
        self.assertEqual(second.status_code, 200, second.text)
        self.assertNotEqual(second.json()["refresh_token"], first["refresh_token"])

    def test_07_old_refresh_token_cannot_be_reused(self):
        body = self._login()
        rotated = self._refresh(body["refresh_token"])
        self.assertEqual(rotated.status_code, 200)
        replay = self._refresh(body["refresh_token"])
        self.assertEqual(replay.status_code, 401, replay.text)

    def test_08_replay_revokes_the_token_family(self):
        body = self._login()
        first = self._refresh(body["refresh_token"])
        self.assertEqual(first.status_code, 200)
        # Replay the ORIGINAL token → rejected as reuse...
        replay = self._refresh(body["refresh_token"])
        self.assertEqual(replay.status_code, 401, replay.text)
        self.assertIn("reuse", replay.json()["detail"].lower())
        # ...and the whole session family is revoked: the CURRENT token
        # (first rotation) can no longer refresh either.
        after = self._refresh(first.json()["refresh_token"])
        self.assertEqual(after.status_code, 401, after.text)

    def test_09_logout_marks_session_revoked_in_database(self):
        body = self._login()
        r = self.client.post(
            "/api/auth/logout", headers=self._headers(body["access_token"])
        )
        self.assertEqual(r.status_code, 200, r.text)
        self.assertTrue(r.json()["revoked"])
        session = self._session_row(body["access_token"])
        self.assertIsNotNone(session.revoked_at)
        self.assertEqual(session.revoke_reason, "logout")

    def test_10_logout_succeeds_and_is_idempotent(self):
        body = self._login()
        for _ in range(2):
            r = self.client.post(
                "/api/auth/logout", headers=self._headers(body["access_token"])
            )
            self.assertEqual(r.status_code, 200, r.text)

    def test_11_refresh_after_logout_fails(self):
        body = self._login()
        self.client.post(
            "/api/auth/logout", headers=self._headers(body["access_token"])
        )
        r = self._refresh(body["refresh_token"])
        self.assertEqual(r.status_code, 401, r.text)

    def test_12_expired_refresh_token_rejected(self):
        import auth as auth_mod

        body = self._login()
        now = datetime.now(timezone.utc)
        expired = jwt.encode(
            {
                "sub": "whatever", "iat": now - timedelta(hours=2),
                "exp": now - timedelta(hours=1),
                "type": "refresh", "jti": "c" * 32, "sid": "d" * 36,
            },
            auth_mod._refresh_jwt_secret(), algorithm=auth_mod.JWT_ALGORITHM,
        )
        r = self._refresh(expired)
        self.assertEqual(r.status_code, 401, r.text)

    def test_12b_expired_database_session_rejected(self):
        body = self._login()
        sid = self._sid(body["access_token"])
        self._update_session(
            sid,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
            - timedelta(days=1),
        )
        r = self._refresh(body["refresh_token"])
        self.assertEqual(r.status_code, 401, r.text)

    def test_13_refresh_works_without_authorization_header(self):
        body = self._login()
        # No Authorization header at all — refresh must not require one.
        r = self.client.post(
            "/api/auth/refresh",
            json={"refresh_token": body["refresh_token"]},
        )
        self.assertEqual(r.status_code, 200, r.text)

    def test_14_two_sessions_are_independent(self):
        session_a = self._login()
        session_b = self._login()
        self.assertNotEqual(session_a["refresh_token"], session_b["refresh_token"])
        ra = self._refresh(session_a["refresh_token"])
        rb = self._refresh(session_b["refresh_token"])
        self.assertEqual(ra.status_code, 200, ra.text)
        self.assertEqual(rb.status_code, 200, rb.text)

    def test_15_revoking_session_a_does_not_revoke_session_b(self):
        session_a = self._login()
        session_b = self._login()

        logout = self.client.post(
            "/api/auth/logout", headers=self._headers(session_a["access_token"])
        )
        self.assertEqual(logout.status_code, 200, logout.text)

        # Session B still refreshes...
        rb = self._refresh(session_b["refresh_token"])
        self.assertEqual(rb.status_code, 200, rb.text)
        # ...while session A's refresh token is dead.
        ra = self._refresh(session_a["refresh_token"])
        self.assertEqual(ra.status_code, 401, ra.text)

    def test_16_missing_or_ambiguous_token_types_rejected(self):
        """Tokens without type, or with wrong type, must not authenticate."""
        import auth as auth_mod

        now = datetime.now(timezone.utc)
        real_user_id = self.signup_body["user"]["id"]
        # No type claim at all (legacy-shaped) but otherwise valid: signed
        # with the access key and for a REAL user — so 401 proves the strict
        # type requirement, not a failed user lookup.
        legacy = jwt.encode(
            {"sub": real_user_id, "iat": now, "exp": now + timedelta(minutes=5)},
            auth_mod._jwt_secret(), algorithm=auth_mod.JWT_ALGORITHM,
        )
        self.assertEqual(self._me(legacy).status_code, 401)
        # type=refresh passed as bearer.
        body = self._login()
        self.assertEqual(self._me(body["refresh_token"]).status_code, 401)


if __name__ == "__main__":
    unittest.main()
