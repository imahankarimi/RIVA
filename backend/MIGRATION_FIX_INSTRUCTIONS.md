# RIVA Login Fix - Migration Instructions

## Problem
Login fails with HTTP 500 error:
```
psycopg.errors.UndefinedColumn: column users.is_verified does not exist
```

## Root Cause
The local database is at revision `9d3f6a1c8e42`, but the code expects `d4e5f6a7b8c9` which includes the `users.is_verified` column.

## What Will Be Applied
Four pending migrations from `9d3f6a1c8e42` → `d4e5f6a7b8c9`:

1. **add_production_indexes** - Performance indexes on existing tables
2. **9e8f7c6a5b4d** - `business_members` table for multi-user support
3. **c3d4e5f6a7b8** - `user_sessions` table for refresh token rotation (merge revision)
4. **d4e5f6a7b8c9** - Email verification and password reset:
   - `verification_tokens` table
   - `password_reset_tokens` table
   - `users.is_verified` column ← **fixes the login error**

## Prerequisites
- PostgreSQL running on `localhost:5432`
- Database `ledgerai` exists
- Backend virtual environment activated
- `DATABASE_URL` environment variable set

## Safety
- **Automatic backup**: `safe_backup.py` creates a validated PostgreSQL dump before any changes
- **Schema verification**: `run_migration.py` validates the final state
- **No data loss**: Migrations only add tables/columns/indexes, never delete
- **Rollback ready**: Backup location printed if restoration needed

## How to Run

### Option 1: Automated Script (Recommended)
```bash
cd backend
source .venv/bin/activate
export DATABASE_URL=postgresql+psycopg://localhost/ledgerai  # or load from .env
./APPLY_MIGRATION.sh
```

### Option 2: Manual Step-by-Step
```bash
cd backend
source .venv/bin/activate
export DATABASE_URL=postgresql+psycopg://localhost/ledgerai

# Step 1: Create validated backup
python3 safe_backup.py

# Step 2: Run migrations with validation
python3 run_migration.py

# Step 3: Verify users.is_verified exists
psql -d ledgerai -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified';"
```

## Expected Output
```
==========================================
RIVA Migration Fix
==========================================

Database: ledgerai

Step 1: Creating backup...
Database: ledgerai at localhost:5432
Creating backup at backups/ledgerai_backup_20261014_173328.dump...
✓ Backup created: 123,456 bytes
Validating backup...
✓ Backup is valid and contains 5 critical tables

Step 2: Running migration...
INFO  [alembic.runtime.migration] Running upgrade 9d3f6a1c8e42 -> add_production_indexes
INFO  [alembic.runtime.migration] Running upgrade add_production_indexes, cf214f9059af -> 9e8f7c6a5b4d
INFO  [alembic.runtime.migration] Running upgrade 9e8f7c6a5b4d, add_production_indexes -> c3d4e5f6a7b8
INFO  [alembic.runtime.migration] Running upgrade c3d4e5f6a7b8 -> d4e5f6a7b8c9

✓ MIGRATION COMPLETE
Final revision: d4e5f6a7b8c9

Step 3: Verifying users.is_verified...
✓ users.is_verified exists

==========================================
✓ Migration Complete
==========================================

The database is now at revision d4e5f6a7b8c9
Login should now work without UndefinedColumn errors
```

## After Migration
1. **Restart the backend server**:
   ```bash
   cd backend
   ./run-backend.sh
   ```

2. **Test login at http://localhost:3000**

3. **Verify the fix**:
   ```bash
   # The backend should start without import errors
   # Login should return HTTP 200 with tokens
   # No UndefinedColumn errors in logs
   ```

## If Migration Fails

### Restore from backup:
```bash
# The backup path will be printed in the migration output
dropdb ledgerai
createdb ledgerai
pg_restore -d ledgerai backups/ledgerai_backup_YYYYMMDD_HHMMSS.dump
```

### Common issues:
- **PostgreSQL not running**: Start with `brew services start postgresql@16` or similar
- **Connection refused**: Check `DATABASE_URL` in `.env` matches your PostgreSQL config
- **Permission denied**: Ensure PostgreSQL user has CREATE privileges
- **Index already exists**: Run `alembic downgrade 9d3f6a1c8e42` then try again

## What Changes
- ✓ New tables: `business_members`, `user_sessions`, `verification_tokens`, `password_reset_tokens`
- ✓ New column: `users.is_verified` (default `false`)
- ✓ New indexes: 16 performance indexes on existing tables
- ✗ No data deleted
- ✗ No schema changes to existing columns
- ✗ No business/accounting data touched

## Verification Checklist
After running the migration:

- [ ] `alembic current` shows `d4e5f6a7b8c9 (head)`
- [ ] `psql -d ledgerai -c "\d users"` shows `is_verified | boolean`
- [ ] `psql -d ledgerai -c "\dt"` shows `business_members`, `user_sessions`, `verification_tokens`, `password_reset_tokens`
- [ ] Backend starts without import errors
- [ ] Login works at `http://localhost:3000`
- [ ] No `UndefinedColumn` errors in backend logs

## Migration Chain Reference
```
b24e856db049 (create_accounting_core)
  └─> 80826bf18053 (strengthen_accounting_models)
      └─> cf214f9059af (add_users_for_authentication)
          ├─> 3f1a9c2b6e10 (multi_business_profile_conversations)
          │   └─> 7a2c4e9f1b30 (add_toman_currency)
          │       └─> 9d3f6a1c8e42 (add_business_context) ← CURRENT
          │           └─> add_production_indexes
          └─> 9e8f7c6a5b4d (add_business_members_table)
          
add_production_indexes + 9e8f7c6a5b4d (merge)
  └─> c3d4e5f6a7b8 (add_user_sessions_for_refresh_rotation)
      └─> d4e5f6a7b8c9 (add_verification_and_password_reset_tokens) ← TARGET
```
