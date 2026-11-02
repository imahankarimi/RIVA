"""add business members table

Revision ID: 9e8f7c6a5b4d
Revises: cf214f9059af
Create Date: 2026-10-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "9e8f7c6a5b4d"
down_revision: Union[str, Sequence[str], None] = "cf214f9059af"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "business_members",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("business_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "user_id", name="uq_business_member"),
    )
    op.create_index(
        op.f("ix_business_members_business_id"), "business_members", ["business_id"]
    )
    op.create_index(
        op.f("ix_business_members_user_id"), "business_members", ["user_id"]
    )
    op.create_index(
        op.f("ix_business_members_role"), "business_members", ["role"]
    )

def downgrade() -> None:
    op.drop_index(op.f("ix_business_members_role"), table_name="business_members")
    op.drop_index(op.f("ix_business_members_user_id"), table_name="business_members")
    op.drop_index(op.f("ix_business_members_business_id"), table_name="business_members")
    op.drop_table("business_members")
