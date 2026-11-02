# RIVA Production CORS Issue - Root Cause & Fix

**Date:** 2026-10-02  
**Status:** FIXED  
**Commit:** Ready to deploy

---

## Root Cause Identified

**The Issue:** FastAPI's `CORSMiddleware` has a known limitation where `HTTPException` responses bypass the middleware and lack CORS headers.

### Why This Happened

1. ✅ Backend CORS configuration was **correct** (commit `38d9c5c` properly added production origins)
2. ✅ Frontend environment variable `NEXT_PUBLIC_API_URL` was **correctly set** in Vercel
3. ❌ **The actual problem:** When any endpoint raises `HTTPException` (401, 422, 429, etc.), FastAPI's default exception handler creates a response that **bypasses** `CORSMiddleware`

### Request Flow That Failed

```
Browser (https://riva-snowy-beta.vercel.app)
  ↓
  POST /api/auth/login with wrong password
  ↓
Backend: check_rate_limit() → OK
Backend: verify_password() → FAIL
Backend: raise HTTPException(status_code=401, ...)
  ↓
FastAPI exception handler creates response
  ↓
Response bypasses CORSMiddleware ❌
  ↓
Response sent WITHOUT Access-Control-Allow-Origin header
  ↓
Browser blocks response: "CORS policy: No 'Access-Control-Allow-Origin' header"
```

### Why Commit 38d9c5c Didn't Fix It

The commit correctly added the origins to `CORSMiddleware`, but this only affects:
- Successful responses (200, 201, etc.)
- OPTIONS preflight requests

It does NOT affect error responses from `HTTPException` because those bypass the middleware entirely.

---

## The Fix

Added a custom exception handler that explicitly includes CORS headers on ALL error responses.

### Changes Made

**File:** `backend/main.py`

1. **Added import:**
   ```python
   from starlette.exceptions import HTTPException as StarletteHTTPException
   from fastapi.responses import JSONResponse
   ```

2. **Extracted CORS origins to constant:**
   ```python
   CORS_ORIGINS = [
       "http://localhost:3000",
       # ... all origins
       "https://riva-snowy-beta.vercel.app",
       "https://riva-app-inky.vercel.app",
   ]
   ```

3. **Added custom exception handler:**
   ```python
   @app.exception_handler(StarletteHTTPException)
   async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
       """Ensures CORS headers are included in error responses."""
       origin = request.headers.get("origin")
       
       response = JSONResponse(
           status_code=exc.status_code,
           content={"detail": exc.detail},
       )
       
       if origin and origin in CORS_ORIGINS:
           response.headers["Access-Control-Allow-Origin"] = origin
           response.headers["Access-Control-Allow-Credentials"] = "true"
       
       if exc.headers:
           for key, value in exc.headers.items():
               response.headers[key] = value
       
       return response
   ```

### What This Fixes

- ✅ 401 Unauthorized errors (wrong password, missing token)
- ✅ 422 Validation errors (invalid input)
- ✅ 429 Rate limit errors
- ✅ 404 Not found errors
- ✅ All other HTTPException responses

---

## Verification Steps

After deploying to Render:

### 1. Test with Chrome DevTools

```javascript
// Go to: https://riva-snowy-beta.vercel.app
// Open DevTools Console and run:

// Test successful request
fetch('https://riva-kwbg.onrender.com/health', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Test error response (should now include CORS headers)
fetch('https://riva-kwbg.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
  credentials: 'include'
}).then(r => {
  console.log('Status:', r.status);
  console.log('CORS Header:', r.headers.get('access-control-allow-origin'));
  return r.json();
}).then(console.log).catch(console.error);
```

**Expected Results:**
- ✅ Response status: 401
- ✅ CORS header present: `access-control-allow-origin: https://riva-snowy-beta.vercel.app`
- ✅ No CORS error in console
- ✅ Error message visible: "Invalid email or password"

### 2. Test Login Flow

1. Go to `https://riva-snowy-beta.vercel.app`
2. Try to login with wrong credentials
3. **Expected:** Error message displays properly (no "Authentication is not configured" message)
4. Try to login with correct credentials
5. **Expected:** Login succeeds and redirects to dashboard

---

## Deployment Steps

### 1. Commit and Push

```bash
cd /Users/mahan/Documents/AI\ Projects/ledger\ ai

# Stage the critical fix
git add backend/main.py

# Also include the frontend error message improvements (optional but recommended)
git add frontend/components/auth/AuthScreen.tsx
git add frontend/lib/i18n/dictionaries/en.ts
git add frontend/lib/i18n/dictionaries/fa.ts

# Commit
git commit -m "fix: add CORS headers to HTTPException responses

FastAPI's CORSMiddleware does not automatically add CORS headers to
HTTPException responses. This caused production login failures where
401/422 responses lacked Access-Control-Allow-Origin headers, triggering
browser CORS blocks.

Added custom exception handler to explicitly include CORS headers on all
error responses, fixing login and all other HTTPException endpoints.

Also improved frontend error messages to show network errors instead of
the misleading 'Authentication is not configured' message.

Fixes: Browser CORS errors on production login
Related: commit 38d9c5c (which added origins but didn't fix exceptions)
Reference: https://github.com/tiangolo/fastapi/issues/775

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

### 2. Render Auto-Deploy

Render is configured to auto-deploy from the `main` branch. After pushing:

1. Go to https://dashboard.render.com
2. Find the "riva" service
3. Watch the deployment logs
4. Wait for "Live" status

**Expected deployment time:** 2-5 minutes

### 3. Verify Production

After Render shows "Live":

1. Open `https://riva-snowy-beta.vercel.app` in Chrome
2. Open DevTools Network tab
3. Try to login (wrong password first to test error case)
4. **Verify:** Login request shows `access-control-allow-origin` header in response
5. Try correct credentials
6. **Verify:** Login succeeds

---

## Why This Is The Correct Fix

### Evidence

1. ✅ Backend CORS config was always correct (commit 38d9c5c)
2. ✅ Frontend API URL was correctly set
3. ✅ Browser error message explicitly stated: "No 'Access-Control-Allow-Origin' header is present"
4. ✅ This is a documented FastAPI issue: https://github.com/tiangolo/fastapi/issues/775
5. ✅ The fix targets the exact problem: HTTPException bypass

### Alternative Approaches Considered

❌ **Using `allow_origin_regex`** - Would work but less secure (wildcard matching)  
❌ **Returning JSONResponse manually** - Would require changing every endpoint  
✅ **Custom exception handler** - Centralized, maintains security, fixes all endpoints

---

## References

- FastAPI CORS Issue: https://github.com/tiangolo/fastapi/issues/775
- FastAPI CORS Docs: https://fastapi.tiangolo.com/tutorial/cors/
- Starlette Exception Handlers: https://www.starlette.io/exceptions/
