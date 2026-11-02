"""Token models for email verification and password reset.

Phase 2B security requirements:
- Tokens are hashed before storage (never store raw tokens)
- Single-use: consumed flag prevents reuse
- Time-limited: expiry enforced
- Atomic consumption: database transaction prevents concurrent reuse
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def generate_token() -> str:
    """Generate a cryptographically secure random token.

    Returns 32 random bytes encoded as URL-safe base64 (43 chars).
    """
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for secure storage.

    Uses SHA256 - sufficient for token verification (these are random,
    not passwords). Returns hex digest (64 chars).
    """
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


class VerificationToken(Base):
    """Email verification token for new signups.

    Lifecycle:
    1. User signs up
    2. Server generates random token, stores hash + expiry
    3. Server sends token in verification email/link
    4. User clicks link → server verifies hash matches, not expired, not consumed
    5. Server marks consumed=True atomically, updates user.is_verified
    """
    __tablename__ = "verification_tokens"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # SHA256 hash of the actual token (64 hex chars)
    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,  # for lookup
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    consumed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # Redundant boolean for fast queries - always matches (consumed_at IS NOT NULL)
    consumed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


class PasswordResetToken(Base):
    """Password reset token for forgot-password flow.

    Lifecycle:
    1. User requests reset (unauthenticated)
    2. Server generates random token, stores hash + expiry
    3. Server sends token in reset email/link
    4. User clicks link, submits new password
    5. Server verifies hash matches, not expired, not consumed
    6. Server atomically: consumes token, updates password hash, revokes all sessions
    """
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # SHA256 hash of the actual token
    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    consumed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    consumed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


def create_verification_token(user_id: str, validity_hours: int = 24) -> tuple[VerificationToken, str]:
    """Create a verification token for a user.

    Returns:
        (token_record, raw_token): The DB record (with hash) and the raw token to send
    """
    raw_token = generate_token()
    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    record = VerificationToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=now + timedelta(hours=validity_hours),
    )

    return record, raw_token


def create_password_reset_token(user_id: str, validity_hours: int = 2) -> tuple[PasswordResetToken, str]:
    """Create a password reset token for a user.

    Shorter validity than verification (2 hours default) since reset is
    security-sensitive and user-initiated.

    Returns:
        (token_record, raw_token): The DB record (with hash) and the raw token to send
    """
    raw_token = generate_token()
    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    record = PasswordResetToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=now + timedelta(hours=validity_hours),
    )

    return record, raw_token
