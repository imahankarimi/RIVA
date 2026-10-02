"""Database migration: Add critical indexes for production scalability.

Fixes:
1. N+1 query problems with eager loading
2. Missing indexes on foreign keys and filter columns
3. Slow queries on large datasets

For 1000+ concurrent users and growing data.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_production_indexes'
down_revision = '9d3f6a1c8e42'  # Current head of chain
branch_labels = None
depends_on = None


def upgrade():
    """Add production-critical indexes."""

    # Users table - email is already indexed (unique), add business_id for joins
    op.create_index(
        'ix_users_business_id',
        'users',
        ['business_id'],
        unique=False
    )

    # Businesses table - owner_id for ownership queries
    op.create_index(
        'ix_businesses_owner_id',
        'businesses',
        ['owner_id'],
        unique=False
    )

    # Businesses table - created_at for ordering
    op.create_index(
        'ix_businesses_created_at',
        'businesses',
        ['created_at'],
        unique=False
    )

    # Accounts table - business_id already has implicit index (FK)
    # Add composite index for business_id + code (common filter)
    op.create_index(
        'ix_accounts_business_id_code',
        'accounts',
        ['business_id', 'code'],
        unique=False
    )

    # Accounts table - account_type for filtering by type
    op.create_index(
        'ix_accounts_account_type',
        'accounts',
        ['account_type'],
        unique=False
    )

    # Journal entries - business_id + transaction_date (most common query)
    op.create_index(
        'ix_journal_entries_business_date',
        'journal_entries',
        ['business_id', 'transaction_date'],
        unique=False
    )

    # Journal entries - transaction_date DESC for recent transactions
    op.create_index(
        'ix_journal_entries_transaction_date_desc',
        'journal_entries',
        [sa.text('transaction_date DESC')],
        unique=False
    )

    # Journal lines - journal_entry_id already indexed (FK)
    # Add account_id for balance calculations
    op.create_index(
        'ix_journal_lines_account_id',
        'journal_lines',
        ['account_id'],
        unique=False
    )

    # Journal lines - composite for entry + account lookups
    op.create_index(
        'ix_journal_lines_entry_account',
        'journal_lines',
        ['journal_entry_id', 'account_id'],
        unique=False
    )

    # Chat conversations - business_id already indexed
    # Add updated_at for ordering recent conversations
    op.create_index(
        'ix_chat_conversations_updated_at',
        'chat_conversations',
        ['updated_at'],
        unique=False
    )

    # Chat conversations - composite index for list query
    op.create_index(
        'ix_chat_conversations_business_updated',
        'chat_conversations',
        ['business_id', 'updated_at'],
        unique=False
    )

    # Chat messages - conversation_id already indexed
    # Add created_at for message ordering
    op.create_index(
        'ix_chat_messages_created_at',
        'chat_messages',
        ['created_at'],
        unique=False
    )

    # Chat messages - composite for fetching recent messages
    op.create_index(
        'ix_chat_messages_conv_role_type',
        'chat_messages',
        ['conversation_id', 'role', 'msg_type', 'created_at'],
        unique=False
    )


def downgrade():
    """Remove indexes if migration is rolled back."""

    op.drop_index('ix_chat_messages_conv_role_type', table_name='chat_messages')
    op.drop_index('ix_chat_messages_created_at', table_name='chat_messages')
    op.drop_index('ix_chat_conversations_business_updated', table_name='chat_conversations')
    op.drop_index('ix_chat_conversations_updated_at', table_name='chat_conversations')
    op.drop_index('ix_journal_lines_entry_account', table_name='journal_lines')
    op.drop_index('ix_journal_lines_account_id', table_name='journal_lines')
    op.drop_index('ix_journal_entries_transaction_date_desc', table_name='journal_entries')
    op.drop_index('ix_journal_entries_business_date', table_name='journal_entries')
    op.drop_index('ix_accounts_account_type', table_name='accounts')
    op.drop_index('ix_accounts_business_id_code', table_name='accounts')
    op.drop_index('ix_businesses_created_at', table_name='businesses')
    op.drop_index('ix_businesses_owner_id', table_name='businesses')
    op.drop_index('ix_users_business_id', table_name='users')
