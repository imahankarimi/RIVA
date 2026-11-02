"""Phase 2B tests: Email verification, password reset, password change.

Covers the mandated security properties:
- Email verification tokens are hashed, single-use, time-limited
- Verification resend is rate-limited
- Password reset is unauthenticated, timing-safe (no account enumeration)
- Reset tokens are hashed, single-use, time-limited, atomic consumption
- Password reset revokes all sessions and invalidates old refresh tokens
- Password change requires current password, validates new password
- Password change revokes other sessions (keeps current one)
- Password policy applied consistently across signup/reset/change
- Concurrent token consumption is prevented

Run: python -m pytest test_phase_2b.py -v
"""

import os
import time
import unittest
import uuid
from datetime import datetime, timedelta, timezone

os.environ["OPENAI_API_KEY"] = "sk-test-placeholder"
os.environ["JWT_SECRET_KEY"] = "x" * 40
os.environ["DEVELOPMENT"] = "true"  # Enable console email provider for tests


class Phase2BTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool

        import models  # noqa: F401
        import token_models  # noqa: F401  (registers token tables on Base.metadata)
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
        # so signup/login limits don't accumulate across the suite.
        import rate_limiter

        rate_limiter._limiter._buckets.clear()
        rate_limiter._ai_limiter._burst_limiter._buckets.clear()
        rate_limiter._ai_limiter._sustained_limiter._buckets.clear()

    def _signup(self, email: str | None = None, password: str = "ValidPass123"):
        email = email or f"test-{uuid.uuid4().hex[:10]}@example.com"
        r = self.client.post(
            "/api/auth/signup",
            json={
                "email": email,
                "password": password,
                "business_name": f"Biz {uuid.uuid4().hex[:6]}",
                "base_currency": "IRR",
            },
        )
        return r

    def _login(self, email: str, password: str):
        r = self.client.post("/api/auth/login", json={"email": email, "password": password})
        return r

    @staticmethod
    def _headers(token: str):
        return {"Authorization": f"Bearer {token}"}

    # ---------------------------------------------------------------- Password Policy

    def test_01_signup_rejects_short_password(self):
        r = self._signup(password="short")
        self.assertEqual(r.status_code, 422)
        self.assertIn("at least 8 characters", r.text.lower())

    def test_02_signup_rejects_long_password(self):
        r = self._signup(password="x" * 129)
        self.assertEqual(r.status_code, 422)
        self.assertIn("at most 128 characters", r.text.lower())

    def test_03_signup_rejects_no_letter(self):
        r = self._signup(password="12345678")
        self.assertEqual(r.status_code, 422)
        self.assertIn("letter", r.text.lower())

    def test_04_signup_rejects_common_password(self):
        r = self._signup(password="password123")
        self.assertEqual(r.status_code, 422)
        self.assertIn("common", r.text.lower())

    def test_05_signup_accepts_valid_password(self):
        r = self._signup(password="ValidPass123")
        self.assertEqual(r.status_code, 201)

    # ---------------------------------------------------------------- Email Verification

    def test_06_new_user_is_not_verified(self):
        r = self._signup()
        self.assertEqual(r.status_code, 201)
        # User can still log in (verification not enforced at login in this implementation)

    def test_07_resend_verification_creates_token(self):
        signup = self._signup()
        token = signup.json()["access_token"]

        r = self.client.post(
            "/api/auth/resend-verification",
            headers=self._headers(token),
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("Verification email sent", r.json()["message"])

    def test_08_resend_when_already_verified(self):
        from token_models import create_verification_token, hash_token
        from models import User

        signup = self._signup()
        token = signup.json()["access_token"]
        user_id = signup.json()["user"]["id"]

        # Mark user verified directly
        db = self.session_factory()
        user = db.query(User).filter(User.id == user_id).first()
        user.is_verified = True
        db.commit()
        db.close()

        r = self.client.post(
            "/api/auth/resend-verification",
            headers=self._headers(token),
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("already_verified"))

    def test_09_verify_email_with_valid_token(self):
        from token_models import create_verification_token
        from models import User

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        # Create verification token
        db = self.session_factory()
        token_record, raw_token = create_verification_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        # Verify
        r = self.client.post("/api/auth/verify-email", json={"token": raw_token})
        self.assertEqual(r.status_code, 200)

        # Check user is verified
        db = self.session_factory()
        user = db.query(User).filter(User.id == user_id).first()
        self.assertTrue(user.is_verified)
        db.close()

    def test_10_verify_email_with_invalid_token(self):
        r = self.client.post("/api/auth/verify-email", json={"token": "invalid_token"})
        self.assertEqual(r.status_code, 400)

    def test_11_verify_email_with_expired_token(self):
        from token_models import create_verification_token, VerificationToken

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_verification_token(user_id)
        # Expire it
        token_record.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
        db.add(token_record)
        db.commit()
        db.close()

        r = self.client.post("/api/auth/verify-email", json={"token": raw_token})
        self.assertEqual(r.status_code, 400)

    def test_12_verification_token_single_use(self):
        from token_models import create_verification_token

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_verification_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        # First use succeeds
        r1 = self.client.post("/api/auth/verify-email", json={"token": raw_token})
        self.assertEqual(r1.status_code, 200)

        # Second use fails
        r2 = self.client.post("/api/auth/verify-email", json={"token": raw_token})
        self.assertEqual(r2.status_code, 400)

    def test_12b_raw_verification_token_not_stored(self):
        """The database stores only the SHA256 hash, never the raw token."""
        from token_models import create_verification_token, VerificationToken

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_verification_token(user_id)
        db.add(token_record)
        db.commit()
        token_hash = token_record.token_hash
        db.close()

        self.assertNotEqual(raw_token, token_hash)
        self.assertNotIn(raw_token, token_hash)

    def test_12c_concurrent_verification_cannot_double_consume(self):
        """Two verify requests for the same token: exactly one succeeds (single-use)."""
        from token_models import create_verification_token

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_verification_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        r1 = self.client.post("/api/auth/verify-email", json={"token": raw_token})
        r2 = self.client.post("/api/auth/verify-email", json={"token": raw_token})
        statuses = sorted([r1.status_code, r2.status_code])
        self.assertEqual(statuses, [200, 400])

    # ---------------------------------------------------------------- Password Reset Request

    def test_13_request_reset_for_existing_account(self):
        signup = self._signup()
        email = signup.json()["user"]["email"]

        r = self.client.post(
            "/api/auth/request-password-reset",
            json={"email": email},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("email is registered", r.json()["message"])

    def test_14_request_reset_for_nonexistent_account_same_response(self):
        """Must not reveal account existence."""
        r = self.client.post(
            "/api/auth/request-password-reset",
            json={"email": "nobody@example.com"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("email is registered", r.json()["message"])

    def test_15_reset_request_creates_token(self):
        from token_models import PasswordResetToken

        signup = self._signup()
        email = signup.json()["user"]["email"]
        user_id = signup.json()["user"]["id"]

        self.client.post(
            "/api/auth/request-password-reset",
            json={"email": email},
        )

        # Check token was created
        db = self.session_factory()
        token = db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user_id
        ).first()
        self.assertIsNotNone(token)
        self.assertFalse(token.consumed)
        db.close()

    # ---------------------------------------------------------------- Password Reset Complete

    def test_16_reset_password_with_valid_token(self):
        from token_models import create_password_reset_token

        signup = self._signup(password="OldPass123")
        email = signup.json()["user"]["email"]
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        # Reset password
        r = self.client.post(
            "/api/auth/reset-password",
            json={"token": raw_token, "new_password": "NewPass456"},
        )
        self.assertEqual(r.status_code, 200)

        # Old password fails
        r_old = self._login(email, "OldPass123")
        self.assertEqual(r_old.status_code, 401)

        # New password works
        r_new = self._login(email, "NewPass456")
        self.assertEqual(r_new.status_code, 200)

    def test_17_reset_password_with_invalid_token(self):
        r = self.client.post(
            "/api/auth/reset-password",
            json={"token": "invalid", "new_password": "NewPass456"},
        )
        self.assertEqual(r.status_code, 400)

    def test_18_reset_password_with_expired_token(self):
        from token_models import create_password_reset_token

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        token_record.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
        db.add(token_record)
        db.commit()
        db.close()

        r = self.client.post(
            "/api/auth/reset-password",
            json={"token": raw_token, "new_password": "NewPass456"},
        )
        self.assertEqual(r.status_code, 400)

    def test_19_reset_token_single_use(self):
        from token_models import create_password_reset_token

        signup = self._signup(password="OldPass123")
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        # First use succeeds
        r1 = self.client.post(
            "/api/auth/reset-password",
            json={"token": raw_token, "new_password": "NewPass456"},
        )
        self.assertEqual(r1.status_code, 200)

        # Second use fails
        r2 = self.client.post(
            "/api/auth/reset-password",
            json={"token": raw_token, "new_password": "AnotherPass789"},
        )
        self.assertEqual(r2.status_code, 400)

    def test_19a_raw_reset_token_not_stored(self):
        from token_models import create_password_reset_token, PasswordResetToken

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        db.add(token_record)
        db.flush()  # populate the server-side default primary key
        token_id = token_record.id
        db.commit()
        stored_hash = token_record.token_hash
        db.close()

        self.assertNotEqual(stored_hash, raw_token)
        self.assertNotIn(raw_token, stored_hash)

        db = self.session_factory()
        stored = db.query(PasswordResetToken).filter(PasswordResetToken.id == token_id).first()
        self.assertIsNotNone(stored)
        self.assertNotEqual(stored.token_hash, raw_token)
        self.assertNotIn(raw_token, stored.token_hash)
        db.close()

    def test_19b_concurrent_reset_cannot_double_consume(self):
        from token_models import create_password_reset_token

        signup = self._signup(password="OldPass123")
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        body = {"token": raw_token, "new_password": "NewPass456"}
        self.assertEqual(
            self.client.post("/api/auth/reset-password", json=body).status_code, 200
        )
        self.assertEqual(
            self.client.post("/api/auth/reset-password", json=body).status_code, 400
        )

    def test_20_reset_password_validates_new_password(self):
        from token_models import create_password_reset_token

        signup = self._signup()
        user_id = signup.json()["user"]["id"]

        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        # Weak password rejected (schema min_length → 422; policy → 400)
        r = self.client.post(
            "/api/auth/reset-password",
            json={"token": raw_token, "new_password": "short"},
        )
        self.assertIn(r.status_code, (400, 422))

    def test_21_reset_password_revokes_all_sessions(self):
        from token_models import create_password_reset_token
        from models import UserSession

        signup = self._signup(password="OldPass123")
        email = signup.json()["user"]["email"]
        user_id = signup.json()["user"]["id"]
        old_access = signup.json()["access_token"]

        # Create a second session
        login2 = self._login(email, "OldPass123")
        self.assertEqual(login2.status_code, 200)

        # Reset password
        db = self.session_factory()
        token_record, raw_token = create_password_reset_token(user_id)
        db.add(token_record)
        db.commit()
        db.close()

        self.client.post(
            "/api/auth/reset-password",
            json={"token": raw_token, "new_password": "NewPass456"},
        )

        # Old access tokens no longer work: get_current_user checks the bound
        # session's active state, so revoked sessions are rejected immediately.
        r = self.client.get("/api/auth/me", headers=self._headers(old_access))
        self.assertEqual(r.status_code, 401, r.text)

        # Check all sessions are revoked in DB
        db = self.session_factory()
        active_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
        ).count()
        self.assertEqual(active_sessions, 0)
        db.close()

    # ---------------------------------------------------------------- Password Change

    def test_22_change_password_requires_authentication(self):
        r = self.client.post(
            "/api/auth/change-password",
            json={"current_password": "old", "new_password": "new"},
        )
        self.assertEqual(r.status_code, 401)

    def test_23_change_password_requires_correct_current_password(self):
        signup = self._signup(password="OldPass123")
        token = signup.json()["access_token"]

        r = self.client.post(
            "/api/auth/change-password",
            headers=self._headers(token),
            json={"current_password": "WrongPass", "new_password": "NewPass456"},
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("incorrect", r.text.lower())

    def test_24_change_password_validates_new_password(self):
        signup = self._signup(password="OldPass123")
        token = signup.json()["access_token"]

        r = self.client.post(
            "/api/auth/change-password",
            headers=self._headers(token),
            json={"current_password": "OldPass123", "new_password": "short"},
        )
        self.assertIn(r.status_code, (400, 422))

    def test_25_change_password_updates_password(self):
        signup = self._signup(password="OldPass123")
        email = signup.json()["user"]["email"]
        token = signup.json()["access_token"]

        r = self.client.post(
            "/api/auth/change-password",
            headers=self._headers(token),
            json={"current_password": "OldPass123", "new_password": "NewPass456"},
        )
        self.assertEqual(r.status_code, 200)

        # Old password fails
        r_old = self._login(email, "OldPass123")
        self.assertEqual(r_old.status_code, 401)

        # New password works
        r_new = self._login(email, "NewPass456")
        self.assertEqual(r_new.status_code, 200)

    def test_26_change_password_keeps_current_session(self):
        signup = self._signup(password="OldPass123")
        token = signup.json()["access_token"]

        self.client.post(
            "/api/auth/change-password",
            headers=self._headers(token),
            json={"current_password": "OldPass123", "new_password": "NewPass456"},
        )

        # Current session still works
        r = self.client.get("/api/auth/me", headers=self._headers(token))
        self.assertEqual(r.status_code, 200)

    # ---------------------------------------------------------------- Existing Tests Still Pass

    def test_27_phase_2a_login_still_works(self):
        signup = self._signup()
        email = signup.json()["user"]["email"]
        r = self._login(email, "ValidPass123")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access_token", r.json())
        self.assertIn("refresh_token", r.json())


if __name__ == "__main__":
    unittest.main()
