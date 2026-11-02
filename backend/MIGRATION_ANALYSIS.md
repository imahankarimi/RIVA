# RIVA Database Migration Analysis

**Date**: 2026-10-14  
**Current Revision**: 9d3f6a1c8e42  
**Target Revision**: d4e5f6a7b8c9  
**Database**: PostgreSQL `ledgerai`

## Migration Chain

The repository has a branching migration history that will be merged:

```
b24e856db049 (base: accounting core)
    ↓
80826bf18053 (accounting constraints)
    ↓
cf214f9059af (users table)
    ↓ ↘
    ↓  9e8f7c6a5b4d (business_members) [BRANCH]
    ↓       ↓
3f1a9c2b6e10 (multi-business, profiles, chat)
    ↓       ↓
7a2c4e9f1b30 (TOMAN currency)
    ↓       ↓
9d3f6a1c8e42 (business context) ← CURRENT DATABASE
    ↓       ↓
add_production_indexes (performance indexes)
    ↓       ↓
    ↓←←←←←←←┘
c3d4e5f6a7b8 (user_sessions, MERGE REVISION)
    ↓
d4e5f6a7b8c9 (verification tokens) ← TARGET
```

## Migrations to Apply

### 1. add_production_indexes
**Revises**: 9d3f6a1c8e42  
**Creates**: Performance indexes on existing tables

**New indexes**:
- `ix_users_business_id` on users(business_id)
- `ix_businesses_owner_id` on businesses(owner_id)
- `ix_businesses_created_at` on businesses(created_at)
- `ix_accounts_business_id_code` on accounts(business_id, code)
- `ix_accounts_account_type` on accounts(account_type)
- `ix_journal_entries_business_date` on journal_entries(business_id, transaction_date)
- `ix_journal_entries_transaction_date_desc` on journal_entries(transaction_date DESC)
- `ix_journal_lines_account_id` on journal_lines(account_id)
- `ix_journal_lines_entry_account` on journal_lines(journal_entry_id, account_id)
- `ix_chat_conversations_updated_at` on chat_conversations(updated_at)
- `ix_chat_conversations_business_updated` on chat_conversations(business_id, updated_at)
- `ix_chat_messages_created_at` on chat_messages(created_at)
- `ix_chat_messages_conv_role_type` on chat_messages(conversation_id, role, msg_type, created_at)

**PostgreSQL compatibility**: ✓ All indexes use standard PostgreSQL syntax

### 2. 9e8f7c6a5b4d - business_members
**Revises**: cf214f9059af (branches from older revision)  
**Creates**: `business_members` table

**Schema**:
```sql
CREATE TABLE business_members (
    id VARCHAR(36) PRIMARY KEY,
    business_id VARCHAR(36) NOT NULL REFERENCES businesses(id),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_business_member UNIQUE (business_id, user_id)
);
CREATE INDEX ix_business_members_business_id ON business_members(business_id);
CREATE INDEX ix_business_members_user_id ON business_members(user_id);
CREATE INDEX ix_business_members_role ON business_members(role);
```

**PostgreSQL compatibility**: ✓

### 3. c3d4e5f6a7b8 - user_sessions (MERGE)
**Revises**: ("9e8f7c6a5b4d", "add_production_indexes")  
**Creates**: `user_sessions` table

**Schema**:
```sql
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    current_jti VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_refreshed_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoke_reason VARCHAR(64),
    user_agent VARCHAR(255),
    ip_address VARCHAR(64),
    CONSTRAINT uq_user_sessions_current_jti UNIQUE (current_jti)
);
CREATE INDEX ix_user_sessions_user_id ON user_sessions(user_id);
```

**PostgreSQL compatibility**: ✓

### 4. d4e5f6a7b8c9 - verification_tokens
**Revises**: c3d4e5f6a7b8  
**Creates**: `verification_tokens`, `password_reset_tokens` tables; adds `users.is_verified`

**Schema**:
```sql
CREATE TABLE verification_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_verification_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX ix_verification_tokens_token_hash ON verification_tokens(token_hash);
CREATE INDEX ix_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX ix_verification_tokens_consumed ON verification_tokens(consumed);

CREATE TABLE password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX ix_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX ix_password_reset_tokens_consumed ON password_reset_tokens(consumed);

ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

**PostgreSQL compatibility**: ✓ (Note: server_default="0" in Python becomes DEFAULT FALSE in PostgreSQL)

## Compatibility Analysis

### PostgreSQL Compatibility: ✓ PASS
- All migrations use standard PostgreSQL types and constraints
- Boolean defaults correctly use PostgreSQL's TRUE/FALSE (not 0/1)
- All foreign keys properly reference existing tables
- Index syntax is PostgreSQL-compatible
- No MySQL-specific or SQLite-specific constructs

### Index Conflicts: ✓ NONE
- No duplicate index names across migrations
- All new indexes target columns without existing indexes
- Composite indexes complement, not duplicate, single-column indexes

### Foreign Key Integrity: ✓ PASS
- business_members references exist: businesses.id, users.id
- user_sessions references exist: users.id
- verification_tokens references exist: users.id
- password_reset_tokens references exist: users.id

### Data Constraints: ✓ SAFE
- No data migrations that could fail on existing data
- All new columns are nullable or have defaults
- users.is_verified has DEFAULT FALSE, safe for existing rows
- No constraint changes to existing columns

## Missing Models (Not Blocking)

The `models.py` file defines an `AuditLog` class, but no migration creates the `audit_logs` table. This is not blocking for Phase 2B but should be addressed later.

## Backup Requirements

Before running migrations:
1. Create custom-format PostgreSQL backup (`pg_dump -F c`)
2. Validate backup with `pg_restore --list`
3. Verify backup contains critical tables: users, businesses, accounts, journal_entries, alembic_version
4. Check backup file is non-empty (actual size should be >10KB for a database with data)

## Post-Migration Validation

After running `alembic upgrade head`, verify:
1. Final revision is `d4e5f6a7b8c9`
2. Tables exist: `business_members`, `user_sessions`, `verification_tokens`, `password_reset_tokens`
3. Column exists: `users.is_verified`
4. All indexes from add_production_indexes are created
5. No foreign key constraint violations

## Rollback Procedure

If migration fails:
```bash
dropdb ledgerai
createdb ledgerai
pg_restore -d ledgerai backups/ledgerai_backup_TIMESTAMP.dump
```

**CRITICAL**: Do not use `psql -d ledgerai -f backup.sql` for plain SQL dumps of a large database. Use custom format (`-F c`) and `pg_restore`.

## Scripts Created

1. **safe_backup.py** - Creates and validates PostgreSQL backup
   - Parses DATABASE_URL with urllib.parse (not string splitting)
   - Uses custom format for validation
   - Validates with `pg_restore --list`
   - Checks for required tables
   - Never prints credentials

2. **run_migration.py** - Runs migration with validation
   - Requires validated backup before proceeding
   - Shows migration plan with user confirmation
   - Runs `alembic upgrade head`
   - Validates final schema
   - Reports exact changes made
   - Clear failure messages with rollback instructions

## Execution Order

```bash
# 1. Load environment
source .env

# 2. Create and validate backup (REQUIRED FIRST STEP)
python3 safe_backup.py

# 3. Run migrations with validation (DO NOT RUN YET - wait for user approval)
python3 run_migration.py
```

## Notes

- Database mutations NOT performed in this analysis
- `alembic upgrade head` NOT executed
- Backup scripts created but NOT run
- All checks are static analysis only
- User must explicitly run safe_backup.py before running run_migration.py
