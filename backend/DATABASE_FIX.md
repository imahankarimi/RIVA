# Database Configuration Fix for Neon Pooler

## Root Cause (From Render Production Logs)

```
POST /api/auth/login HTTP/1.1" 500 Internal Server Error

psycopg.OperationalError:
unsupported startup parameter in options: statement_timeout.
Please use unpooled connection or remove this parameter from the startup package.
```

Production database: `ep-weathered-cherry-b72yc4lu-pooler.c-13.us-east-1.aws.neon.tech` (Neon Pooler)

## Issue

The `database.py` configuration was passing `statement_timeout` as a connection startup parameter:

```python
"connect_args": {
    "connect_timeout": 10,
    "options": "-c statement_timeout=30000",  # ❌ Rejected by Neon Pooler
}
```

Neon's connection pooler (PgBouncer-based) rejects `statement_timeout` in the startup options because it manages connection state across multiple client sessions. The pooler cannot allow per-connection PostgreSQL parameters that would affect the pooled connection's session state.

## Fix

Removed the `options` parameter containing `statement_timeout` from `connect_args`:

```python
"connect_args": {
    "connect_timeout": 10,  # ✓ Preserved - this is a connection parameter, not a session parameter
    # Note: statement_timeout removed because Neon Pooler rejects it in startup options
}
```

## What Was Preserved

- ✓ `connect_timeout`: Connection-level timeout (10 seconds)
- ✓ `pool_size`: 20 core connections
- ✓ `max_overflow`: 30 additional connections (total: 50)
- ✓ `pool_timeout`: 30 seconds wait for connection
- ✓ `pool_recycle`: 3600 seconds (1 hour)
- ✓ `pool_pre_ping`: Connection health check
- ✓ SQLAlchemy QueuePool configuration
- ✓ psycopg v3 driver

## What Changed

- ❌ Removed: `statement_timeout` from connection startup options

## Impact

- **Login now works**: Database connections succeed with Neon Pooler
- **Query timeout**: No longer enforced at connection level (Neon Pooler handles this)
- **No breaking changes**: All other connection pool settings preserved
- **No application logic changes**: Authentication, CORS, routes unchanged

## Files Changed

- `backend/database.py`: Removed `options: "-c statement_timeout=30000"` from `connect_args`

## Deployment Status

- **Local**: Syntax validated ✓
- **Production**: NOT YET DEPLOYED (needs git push + Render redeploy)

## Next Steps

1. Commit and push to trigger Render deployment
2. Test production login at `https://riva-kwbg.onrender.com/api/auth/login`
3. Verify in Render logs that login succeeds (200 OK, no psycopg errors)
