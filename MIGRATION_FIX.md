# Login Fix: Apply Missing is_verified Migration

## Root Cause Confirmed

**Error**: `psycopg.errors.UndefinedColumn: column users.is_verified does not exist`

**Location**: `backend/main.py:435` during login user lookup

**Cause**: The `User` model defines `is_verified` (line 128-131 in `models.py`), but the database schema doesn't have this column yet.

## Solution

Apply the existing Alembic migration `d4e5f6a7b8c9_add_verification_and_password_reset_tokens.py`.

This migration adds:
- `verification_tokens` table
- `password_reset_tokens` table  
- `is_verified` column to `users` (nullable=False, server_default="0")

### Apply the Migration

Run this command from the `backend/` directory:

```bash
cd backend
source .venv/bin/activate
python -m alembic upgrade head
```

### Verify Success

After running the migration, verify it succeeded:

```bash
# Check current revision
python -m alembic current

# Expected output should show:
# d4e5f6a7b8c9 (head)
```

### Test Login

1. Start the backend if it's not running:
   ```bash
   ./run-backend.sh
   ```

2. Test login from the frontend at http://localhost:3000

3. Check for the HTTP 500 error is gone and login works.

## Migration Details

The migration adds `is_verified` with these properties:
- Type: `Boolean`
- Nullable: `False`
- Server default: `"0"` (false)

This means:
- Existing users will have `is_verified=false` by default
- New signups will also default to `is_verified=false`
- No data loss or user record modifications beyond adding the column

## Safety

✓ **Safe for local development database**
✓ **Preserves existing user data, passwords, sessions**
✓ **No destructive operations**
✓ **Reversible with `alembic downgrade -1`**

---

**Claude Code Note**: The sandbox blocks localhost:5432 connections, preventing automatic migration application. This is why you need to run it manually in a regular terminal.
