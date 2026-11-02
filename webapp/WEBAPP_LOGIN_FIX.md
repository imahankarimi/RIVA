# RIVA Web App Login Fix

## Root Cause

The RIVA Web app (webapp/) was failing to authenticate because of **an incorrect API URL configuration**. The webapp's `.env.local` was using a hardcoded local network IP address (`http://172.20.10.5:8000`) instead of `localhost:8000`.

This IP address:
- Changes when you switch WiFi networks
- Is not accessible from all contexts
- Causes connection failures when the network configuration changes

The main RIVA frontend works because it correctly uses `http://localhost:8000`.

## What Was Fixed

### 1. API URL Configuration (`webapp/.env.local`)
**Before:**
```env
NEXT_PUBLIC_API_URL=http://172.20.10.5:8000
```

**After:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. API Client Timeout Handling (`webapp/lib/api/client.ts`)
Added missing request timeout handling to match the main frontend implementation:
- 60-second default timeout for all API requests
- Proper timeout error messages
- AbortController integration for request cancellation

This prevents hung connections and provides better error messages when the backend is slow or unreachable.

### 3. Documentation (`webapp/.env.example`)
Updated with clear instructions for local and production configuration.

## Files Changed

1. **webapp/.env.local** - Fixed API URL to use localhost
2. **webapp/lib/api/client.ts** - Added timeout handling
3. **webapp/.env.example** - Improved documentation

## Vercel Configuration

For the Vercel production deployment, you need to set the following environment variable:

### Required Environment Variable

1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your production backend URL (e.g., `https://api.your-domain.com`)
   - **Environments:** Production, Preview, Development (check all)

### Important Notes

- **DO NOT** use `localhost` or `127.0.0.1` in Vercel - that would point to Vercel's server, not your backend
- **DO NOT** hardcode local IP addresses like `172.20.10.5`
- Use a publicly accessible backend URL (e.g., deployed on Render, Railway, Fly.io, or another hosting service)
- The backend must have CORS configured to allow your Vercel domain

### Backend CORS Configuration

The backend already has the Vercel URLs in its CORS allowlist (`backend/main.py:80-90`):
```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://192.168.1.38:3001",
    "https://riva-snowy-beta.vercel.app",
    "https://riva-app-inky.vercel.app",
]
```

If your Vercel deployment URL is different, add it to this list and redeploy the backend.

## Testing Instructions

### Local Testing

1. **Ensure the backend is running:**
   ```bash
   cd backend
   ./run-backend.sh
   ```
   Backend should be accessible at: http://localhost:8000

2. **Start the webapp in development mode:**
   ```bash
   cd webapp
   npm run dev
   ```
   Webapp will be at: http://localhost:3001

3. **Test the login flow:**
   - Navigate to http://localhost:3001
   - Try logging in with an existing account
   - Or create a new account via signup
   - You should be redirected to `/home` after successful authentication

4. **Verify in browser DevTools:**
   - Open Network tab
   - Look for requests to `http://localhost:8000/api/auth/login`
   - Should return 200 OK with an `access_token`

### Production Testing (Vercel)

1. **Set the environment variable** in Vercel as described above
2. **Redeploy** (or trigger automatic deployment by pushing to your connected Git branch)
3. **Test login** at your Vercel URL
4. **Check browser console** for any CORS or network errors

## Why This Happened

The hardcoded IP `172.20.10.5` was likely set during initial development on a specific WiFi network. When the network changed or the webapp was accessed from a different context, that IP became unreachable, causing all API requests (including login) to fail.

## Prevention

- Never hardcode local IP addresses in `.env.local`
- Always use `localhost` or `127.0.0.1` for local development
- Keep `.env.example` documentation up to date
- Add `.env.local` to `.gitignore` (already done) so hardcoded IPs don't get committed

## Authentication Architecture (For Reference)

Both `frontend/` and `webapp/` use identical authentication code:
- **Auth API:** `lib/api/auth.ts` - login, signup, getCurrentUser
- **API Client:** `lib/api/client.ts` - fetch wrapper with auth token injection
- **Auth Context:** `app/providers.tsx` - AuthProvider with React context
- **Token Storage:** localStorage key `ledgerai.access_token`
- **Auth Gate:** `components/auth/AuthGate.tsx` - redirects to login when unauthenticated

The implementations are identical - the only difference was the API URL configuration.
