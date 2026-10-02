"""multi-business ownership, user profile fields, chat conversations

Revision ID: 3f1a9c2b6e10
Revises: cf214f9059af
Create Date: 2026-09-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3f1a9c2b6e10"
down_revision: Union[str, Sequence[str], None] = "cf214f9059af"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Multi-business support -------------------------------------------------
    op.add_column("businesses", sa.Column("owner_id", sa.String(length=36), nullable=True))
    op.create_foreign_key(
        "fk_businesses_owner_id_users", "businesses", "users", ["owner_id"], ["id"]
    )

    # Backfill: every existing business belongs to the user currently pointing at it.
    op.execute(
        """
        UPDATE businesses
        SET owner_id = users.id
        FROM users
        WHERE users.business_id = businesses.id
        """
    )

    # users.business_id is now "current selection", not a 1:1 ownership link.
    op.drop_constraint("users_business_id_key", "users", type_="unique")

    # --- User profile -------------------------------------------------------------
    op.add_column("users", sa.Column("first_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=100), nullable=True))

    # --- AI Assistant conversation history -----------------------------------------
    op.create_table(
        "chat_conversations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("business_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_chat_conversations_business_id"), "chat_conversations", ["business_id"]
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("conversation_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("msg_type", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("action_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["conversation_id"], ["chat_conversations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_chat_messages_conversation_id"), "chat_messages", ["conversation_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_chat_messages_conversation_id"), table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index(op.f("ix_chat_conversations_business_id"), table_name="chat_conversations")
    op.drop_table("chat_conversations")

    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")

    op.create_unique_constraint("users_business_id_key", "users", ["business_id"])
    op.drop_constraint("fk_businesses_owner_id_users", "businesses", type_="foreignkey")
    op.drop_column("businesses", "owner_id")
