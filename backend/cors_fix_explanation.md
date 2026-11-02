# CORS Issue Root Cause

## The Problem

FastAPI's `CORSMiddleware` has a known limitation: when `HTTPException` is raised from an endpoint, the default exception handler returns a response that **bypasses** the CORS middleware, resulting in missing `Access-Control-Allow-Origin` headers.

## Why This Happens

1. Browser sends preflight OPTIONS request → CORSMiddleware handles it ✓
2. Browser sends actual POST request to `/api/auth/login`
3. Rate limiter or auth validation raises `HTTPException(status_code=401)`
4. FastAPI's exception handler creates a response
5. This response goes directly to the client, **skipping CORSMiddleware**
6. Browser blocks the response due to missing CORS headers

## The Fix

Add explicit exception handlers that ensure CORS headers are included in error responses.

## References

- https://github.com/tiangolo/fastapi/issues/775
- https://fastapi.tiangolo.com/tutorial/cors/#use-corsmiddleware
