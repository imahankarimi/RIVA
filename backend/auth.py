"""JWT, password, and session helpers for RIVA authentication.

Token model (Phase 2A):
- Access token: short-lived (15-30 min), signed with JWT_SECRET_KEY,
  type="access", carries sub + sid (session id). Only access tokens
  authenticate API endpoints.
- Refresh token: signed with a SEPARATE key (JWT_REFRESH_SECRET_KEY, or a
  deterministic HMAC-derived key when unset), type="refresh", carries
  sub + sid + jti. Only exchangeable at POST /api/auth/refresh.
- Revocation is database-backed (models.UserSession) — no process-local
  Python state is part of the security boundary, so rotation and logout
  behave identically across all backend workers.
"""

import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserSession


JWT_ALGORITHM = "HS256"
_bearer_scheme = HTTPBearer(auto_error=False)

# Separate caches so access and refresh secrets can never collide through a
# shared module global (they are distinct keys by construction).
_access_secret_cache: str | None = None
_refresh_secret_cache: str | None = None


def _utcnow() -> datetime:
    """Naive UTC now — matches how DateTime columns are stored."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _jwt_secret() -> str:
    global _access_secret_cache
    if _access_secret_cache is None:
        secret = os.getenv("JWT_SECRET_KEY")
        if not secret or len(secret) < 32:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT authentication is not configured",
            )
        _access_secret_cache = secret
    return _access_secret_cache


def _refresh_jwt_secret() -> str:
    """Signing key for refresh tokens — always distinct key material from
    the access key.

    Prefers JWT_REFRESH_SECRET_KEY (>=32 chars) so it can be rotated
    independently in production. When unset, derives a deterministic
    per-deployment key via HMAC from JWT_SECRET_KEY: all workers derive the
    same key (no per-process randomness), yet it is separate key material,
    so an access token can never validate as a refresh token or vice versa.
    """
    global _refresh_secret_cache
    if _refresh_secret_cache is None:
        explicit = os.getenv("JWT_REFRESH_SECRET_KEY")
        if explicit and len(explicit) >= 32:
            _refresh_secret_cache = explicit
        else:
            access = _jwt_secret()  # raises 500 when JWT_SECRET_KEY is unset
            _refresh_secret_cache = hmac.new(
                access.encode("utf-8"),
                b"riva.refresh-token-signing.v1",
                hashlib.sha256,
            ).hexdigest()  # 64 hex chars
    return _refresh_secret_cache


def _expires_in_minutes() -> int:
    value = os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30")
    try:
        minutes = int(value)
    except ValueError as error:
        raise RuntimeError("JWT_ACCESS_TOKEN_EXPIRES_MINUTES must be an integer") from error
    # For financial applications, max 30 minutes; override via env if needed
    return min(max(minutes, 15), 30)


def _refresh_expires_in_days() -> int:
    value = os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30")
    try:
        days = int(value)
    except ValueError:
        days = 30
    return max(days, 1)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str, sid: str | None = None) -> str:
    """Short-lived access token. type is always explicit: "access"."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=_expires_in_minutes()),
        "type": "access",
    }
    if sid:
        payload["sid"] = sid  # binds the access token to its session (logout)
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(
    *,
    user_id: str,
    sid: str,
    jti: str,
    expires_at: datetime,
) -> str:
    """Refresh token bound to server-side session `sid`.

    `expires_at` is the session's absolute expiry (aware UTC for PyJWT);
    rotation never extends it. The JTI is recorded on the session row
    (current_jti) by the caller — it is NOT marked "used" here; the
    database decides whether it is still current.
    """
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": expires_at,
        "type": "refresh",
        "jti": jti,
        "sid": sid,
    }
    return jwt.encode(payload, _refresh_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode/validate an access token (signature + expiry via JWT_SECRET_KEY)."""
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_refresh_token(token: str) -> dict:
    """JWT-level validation of a refresh token.

    Checks signature (refresh key), type == "refresh", and expiry.
    Session state (revocation / rotation / reuse) is checked separately
    against the database — never against process-local memory.
    """
    try:
        payload = jwt.decode(token, _refresh_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not isinstance(payload.get("sid"), str) or not isinstance(payload.get("jti"), str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_access_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """Dependency: validated access-token payload (strict type check).

    Only type="access" tokens pass. Refresh tokens are signed with a
    different key, so they cannot even reach this check; tokens minted
    before token types existed are rejected (access tokens live <=30 min,
    so the compatibility cost is one re-login).
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized
    payload = decode_access_token(credentials.credentials)
    if payload.get("type") != "access":
        raise unauthorized
    if not isinstance(payload.get("sub"), str):
        raise unauthorized
    return payload


def get_current_user(
    payload: dict = Depends(get_access_payload),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: authenticated user for normal API endpoints.

    Enforcement policy (Phase 2B): access tokens are invalidated the moment
    their bound session is revoked (password reset/change, logout). Tokens
    carry a `sid`; when present, the session must still be active. This is a
    single indexed PK lookup on the hot path — the smallest change that makes
    old tokens stop working immediately after a password reset, instead of
    staying valid until JWT expiry.
    """
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sid = payload.get("sid")
    if sid is not None:
        # Pre-Phase 2A tokens have no sid; they expire in <=30 min either way.
        session = (
            db.query(UserSession)
            .filter(
                UserSession.id == sid,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > _utcnow(),
            )
            .first()
        )
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user


# ---------------------------------------------------------------------------
# Server-side session lifecycle
# ---------------------------------------------------------------------------

def start_session(
    db: Session,
    user_id: str,
    *,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[UserSession, str, str]:
    """Create a session row and mint its access + refresh token pair.

    The caller owns the surrounding transaction/commit. The refresh JTI is
    written as the session's current_jti and is valid from the start.
    """
    now = _utcnow()
    expires_at = now + timedelta(days=_refresh_expires_in_days())
    jti = secrets.token_hex(16)
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user_id,
        current_jti=jti,
        created_at=now,
        expires_at=expires_at,
        user_agent=(user_agent or None) and user_agent[:255],
        ip_address=(ip_address or None) and ip_address[:64],
    )
    db.add(session)
    db.flush()
    access = create_access_token(user_id, sid=session.id)
    refresh = create_refresh_token(
        user_id=user_id, sid=session.id, jti=jti, expires_at=expires_at
    )
    return session, access, refresh


def rotate_session(
    db: Session,
    payload: dict,
) -> tuple[User, str, str]:
    """Validate a refresh token against its session and rotate it.

    Replay model: an old rotated token (jti != session.current_jti) means
    the token family may be compromised — the entire session is revoked
    immediately. Commits the rotation before returning.
    """
    sid = payload["sid"]
    jti = payload["jti"]
    now = _utcnow()

    session = db.query(UserSession).filter(UserSession.id == sid).first()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if session.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if session.current_jti != jti:
        # Reuse of an already-rotated refresh token: treat as compromise
        # and revoke the whole session (token family).
        session.revoked_at = now
        session.revoke_reason = "refresh_reuse"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == session.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_jti = secrets.token_hex(16)
    session.current_jti = new_jti
    session.last_refreshed_at = now
    access = create_access_token(user.id, sid=session.id)
    refresh = create_refresh_token(
        user_id=user.id,
        sid=session.id,
        jti=new_jti,
        expires_at=session.expires_at,
    )
    db.commit()
    return user, access, refresh


def revoke_session(
    db: Session,
    session_id: str,
    reason: str,
) -> bool:
    """Revoke a session by id. Idempotent; returns True if a session was revoked."""
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if session is None or session.revoked_at is not None:
        return False
    session.revoked_at = _utcnow()
    session.revoke_reason = reason
    db.commit()
    return True
