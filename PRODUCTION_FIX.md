# Production Login Fix

## Root Cause
`NEXT_PUBLIC_API_URL` environment variable is missing from both Vercel deployments.

When this variable is undefined, the frontend/webapp API client constructs relative URLs like `/api/auth/login` instead of absolute URLs like `https://riva-kwbg.onrender.com/api/auth/login`.

This causes login requests to be sent to the Vercel app itself (which has no backend), never reaching the FastAPI backend on Render.

## Fix Required

Add the following environment variable to **both** Vercel projects:

### RIVA Desktop (riva-snowy-beta.vercel.app)
```
NEXT_PUBLIC_API_URL=https://riva-kwbg.onrender.com
```

### RIVA App (riva-app-inky.vercel.app)
```
NEXT_PUBLIC_API_URL=https://riva-kwbg.onrender.com
```

## Steps to Fix

1. Go to Vercel dashboard
2. Navigate to **riva** project (RIVA Desktop)
3. Go to Settings → Environment Variables
4. Add:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://riva-kwbg.onrender.com`
   - Environments: Production, Preview, Development (or just Production)
5. Redeploy the production deployment

6. Navigate to **riva-app** project (RIVA App)
7. Go to Settings → Environment Variables
8. Add the same variable
9. Redeploy the production deployment

## Verification

After redeploying both apps with the environment variable:

1. Open browser DevTools
2. Navigate to https://riva-snowy-beta.vercel.app
3. Attempt login
4. Check Network tab - the request should go to `https://riva-kwbg.onrender.com/api/auth/login`
5. Repeat for https://riva-app-inky.vercel.app

## Why Previous CORS Fixes Didn't Work

Commits `82aaa27` and `38d9c5c` added CORS origins and exception handlers correctly, but they had no effect because:

1. The frontend was never sending requests to the backend
2. The backend was receiving zero requests from production frontends
3. The CORS middleware and exception handlers work correctly - they were just never tested

The backend CORS configuration is correct. The issue was purely a missing environment variable.
