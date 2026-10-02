"""Rate limiting middleware for production API protection.

Implements token bucket algorithm with Redis backend (or in-memory fallback).
Protects against:
- Brute force attacks on auth endpoints
- AI API cost explosion
- General API abuse
"""

import os
import time
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# In-Memory Rate Limiter (for development/small deployments)
# ---------------------------------------------------------------------------

class InMemoryRateLimiter:
    """Token bucket rate limiter with in-memory storage.

    WARNING: This is NOT suitable for multi-process deployments.
    For production with multiple workers, use RedisRateLimiter.
    """

    def __init__(self):
        # key -> (tokens, last_refill_time)
        self._buckets: dict[str, tuple[float, float]] = {}
        self._lock = None  # Could use threading.Lock() for thread safety

    def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
    ) -> tuple[bool, dict]:
        """Check if request is within rate limit.

        Returns:
            (allowed: bool, info: dict with remaining/reset)
        """
        now = time.time()

        if key not in self._buckets:
            self._buckets[key] = (max_requests - 1, now)
            return True, {
                "remaining": max_requests - 1,
                "reset": int(now + window_seconds),
            }

        tokens, last_refill = self._buckets[key]

        # Refill tokens based on time elapsed
        elapsed = now - last_refill
        refill_rate = max_requests / window_seconds
        tokens = min(max_requests, tokens + (elapsed * refill_rate))

        if tokens >= 1:
            self._buckets[key] = (tokens - 1, now)
            return True, {
                "remaining": int(tokens - 1),
                "reset": int(now + window_seconds),
            }
        else:
            # Rate limited
            retry_after = int((1 - tokens) / refill_rate)
            return False, {
                "remaining": 0,
                "reset": int(now + retry_after),
                "retry_after": retry_after,
            }

    def reset(self, key: str):
        """Reset rate limit for a key (for testing)."""
        if key in self._buckets:
            del self._buckets[key]


# Global rate limiter instance
_limiter = InMemoryRateLimiter()


# ---------------------------------------------------------------------------
# Rate limit configurations by endpoint type
# ---------------------------------------------------------------------------

RATE_LIMITS = {
    # Auth endpoints: brute-force protection should slow attackers, but must
    # not starve legitimate users sharing a NAT/egress IP (office networks,
    # the test suite, concurrent signups). Generous enough to absorb real
    # bursts, tight enough to deter a single-IP credential spray.
    "auth_login": (20, 300),  # 20 attempts per 5 minutes per IP (was 5)
    "auth_signup": (20, 3600),  # 20 signups per hour per IP (was 3)
    # AI: burst protection for spam, sustained cap for cost control. The burst
    # window must tolerate a human rapidly sending a few messages (typing +
    # retries), while still rejecting programmatic fire-and-forget loops.
    "ai_chat": (60, 60),  # 60 AI requests per minute per user (cost ceiling)
    "ai_chat_burst": (10, 10),  # 10 requests per 10 seconds (spam deterrent)
    "api_default": (100, 60),  # 100 requests per minute per user
}


# ---------------------------------------------------------------------------
# Rate limiting decorators and middleware
# ---------------------------------------------------------------------------

def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers (handles proxies)."""
    # Check common proxy headers
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    # Fallback to direct client
    if request.client:
        return request.client.host

    return "unknown"


def rate_limit_key(request: Request, user_id: str | None = None) -> str:
    """Generate rate limit key from request context."""
    if user_id:
        return f"user:{user_id}"
    return f"ip:{get_client_ip(request)}"


def check_rate_limit(
    request: Request,
    limit_type: str,
    user_id: str | None = None,
) -> None:
    """Check rate limit and raise HTTPException if exceeded.

    Sync by design: called from sync endpoint bodies executing on FastAPI's
    threadpool; the in-memory limiter is blocking by nature.

    Args:
        request: FastAPI request object
        limit_type: Key from RATE_LIMITS dict
        user_id: Optional authenticated user ID (uses IP if None)

    Raises:
        HTTPException: 429 if rate limit exceeded
    """
    if limit_type not in RATE_LIMITS:
        # Unknown limit type, skip rate limiting
        return

    max_requests, window_seconds = RATE_LIMITS[limit_type]
    key = f"{limit_type}:{rate_limit_key(request, user_id)}"

    allowed, info = _limiter.check_rate_limit(key, max_requests, window_seconds)

    # Add rate limit headers to response (informational)
    request.state.rate_limit_remaining = info.get("remaining", 0)
    request.state.rate_limit_reset = info.get("reset", 0)

    if not allowed:
        retry_after = info.get("retry_after", window_seconds)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "retry_after": retry_after,
                "limit": max_requests,
                "window": window_seconds,
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(info["reset"]),
            },
        )


# ---------------------------------------------------------------------------
# AI-specific rate limiting (cost protection)
# ---------------------------------------------------------------------------

class AIRateLimiter:
    """Dedicated rate limiter for AI requests with cost tracking.

    Implements dual rate limits:
    1. Burst protection (prevent spam)
    2. Sustained usage limit (prevent cost explosion)
    """

    def __init__(self):
        self._burst_limiter = InMemoryRateLimiter()
        self._sustained_limiter = InMemoryRateLimiter()
        self._cost_tracker: dict[str, float] = defaultdict(float)

    def check_ai_rate_limit(
        self,
        request: Request,
        user_id: str,
    ) -> None:
        """Check both burst and sustained AI rate limits.

        Raises:
            HTTPException: 429 if either limit exceeded
        """
        # Check burst limit (prevent rapid-fire requests)
        burst_max, burst_window = RATE_LIMITS["ai_chat_burst"]
        burst_key = f"ai_burst:user:{user_id}"
        burst_allowed, burst_info = self._burst_limiter.check_rate_limit(
            burst_key, burst_max, burst_window
        )

        if not burst_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Too many AI requests in quick succession",
                    "retry_after": burst_info.get("retry_after", burst_window),
                    "message": "Please wait a moment before sending another message",
                },
                headers={"Retry-After": str(burst_info.get("retry_after", burst_window))},
            )

        # Check sustained limit (prevent cost explosion)
        sustained_max, sustained_window = RATE_LIMITS["ai_chat"]
        sustained_key = f"ai_sustained:user:{user_id}"
        sustained_allowed, sustained_info = self._sustained_limiter.check_rate_limit(
            sustained_key, sustained_max, sustained_window
        )

        if not sustained_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "AI usage limit exceeded",
                    "retry_after": sustained_info.get("retry_after", sustained_window),
                    "message": f"You've reached the limit of {sustained_max} AI requests per minute",
                },
                headers={"Retry-After": str(sustained_info.get("retry_after", sustained_window))},
            )

    def track_cost(self, user_id: str, cost: float):
        """Track AI API cost per user (for monitoring/billing)."""
        self._cost_tracker[f"user:{user_id}"] += cost

    def get_user_cost(self, user_id: str) -> float:
        """Get total AI cost for a user."""
        return self._cost_tracker.get(f"user:{user_id}", 0.0)


# Global AI rate limiter
_ai_limiter = AIRateLimiter()


def check_ai_rate_limit(request: Request, user_id: str):
    """Check AI-specific rate limits.

    Sync by design: the in-memory limiter is blocking by nature, and the chat
    endpoint that calls this is a sync `def` running on FastAPI's threadpool.
    """
    _ai_limiter.check_ai_rate_limit(request, user_id)


# ---------------------------------------------------------------------------
# Middleware for automatic rate limit headers
# ---------------------------------------------------------------------------

async def rate_limit_middleware(request: Request, call_next: Callable):
    """Add rate limit headers to all responses."""
    response = await call_next(request)

    # Add rate limit info headers if available
    if hasattr(request.state, "rate_limit_remaining"):
        response.headers["X-RateLimit-Remaining"] = str(request.state.rate_limit_remaining)
    if hasattr(request.state, "rate_limit_reset"):
        response.headers["X-RateLimit-Reset"] = str(request.state.rate_limit_reset)

    return response
