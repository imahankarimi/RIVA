"""add verification and password reset tokens

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-10-10

Phase 2B: Email verification and password reset token storage.
Tokens are hashed before storage; consumed flag prevents reuse.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Verification tokens table
    op.create_table(
        "verification_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("consumed", sa.Boolean(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_verification_tokens_token_hash"),
        "verification_tokens",
        ["token_hash"],
    )
    op.create_index(
        op.f("ix_verification_tokens_user_id"),
        "verification_tokens",
        ["user_id"],
    )
    op.create_index(
        op.f("ix_verification_tokens_consumed"),
        "verification_tokens",
        ["consumed"],
    )

    # Password reset tokens table
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("consumed", sa.Boolean(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_password_reset_tokens_token_hash"),
        "password_reset_tokens",
        ["token_hash"],
    )
    op.create_index(
        op.f("ix_password_reset_tokens_user_id"),
        "password_reset_tokens",
        ["user_id"],
    )
    op.create_index(
        op.f("ix_password_reset_tokens_consumed"),
        "password_reset_tokens",
        ["consumed"],
    )

    # Add is_verified to users table (Phase 2B requirement)
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "is_verified")
    op.drop_index(op.f("ix_password_reset_tokens_consumed"), table_name="password_reset_tokens")
    op.drop_index(op.f("ix_password_reset_tokens_user_id"), table_name="password_reset_tokens")
    op.drop_index(op.f("ix_password_reset_tokens_token_hash"), table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_index(op.f("ix_verification_tokens_consumed"), table_name="verification_tokens")
    op.drop_index(op.f("ix_verification_tokens_user_id"), table_name="verification_tokens")
    op.drop_index(op.f("ix_verification_tokens_token_hash"), table_name="verification_tokens")
    op.drop_table("verification_tokens")
