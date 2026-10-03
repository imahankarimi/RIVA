"""Request timeout middleware for production API stability.

Prevents slow requests from blocking workers and exhausting resources.
"""

import asyncio
import time
from fastapi import Request, status
from fastapi.responses import JSONResponse


# Timeout configuration by endpoint type (seconds)
REQUEST_TIMEOUTS = {
    "auth": 10,  # Auth should be fast
    "ai_chat": 60,  # AI requests can be slower
    "reports": 30,  # Report generation
    "default": 30,  # Default for all other endpoints
}


async def timeout_middleware(request: Request, call_next):
    """Enforce request timeouts to prevent resource exhaustion.

    Different endpoints get different timeout limits based on expected
    processing time. This prevents slow queries or AI requests from
    blocking workers indefinitely.
    """
    # Determine timeout based on path
    path = request.url.path
    if path.startswith("/api/auth/"):
        timeout = REQUEST_TIMEOUTS["auth"]
    elif path.startswith("/api/chat"):
        timeout = REQUEST_TIMEOUTS["ai_chat"]
    elif "reports" in path:
        timeout = REQUEST_TIMEOUTS["reports"]
    else:
        timeout = REQUEST_TIMEOUTS["default"]

    try:
        # Execute request with timeout
        start_time = time.time()
        response = await asyncio.wait_for(
            call_next(request),
            timeout=timeout
        )

        # Add timing header for monitoring
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.3f}"

        return response

    except asyncio.TimeoutError:
        response = JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={
                "error": "Request timeout",
                "detail": f"Request exceeded {timeout}s timeout",
                "timeout": timeout,
            }
        )
        # Add CORS headers if origin is present and allowed
        origin = request.headers.get("origin")
        if origin:
            # Match CORS_ORIGINS from main.py
            allowed_origins = {
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:3002",
                "http://192.168.1.38:3001",
                "https://riva-snowy-beta.vercel.app",
                "https://riva-app-inky.vercel.app",
            }
            if origin in allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "*"
        return response
