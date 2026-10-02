"""add business.context_text (free-form AI accounting context)

Revision ID: 9d3f6a1c8e42
Revises: 7a2c4e9f1b30
Create Date: 2026-09-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d3f6a1c8e42"
down_revision: Union[str, Sequence[str], None] = "7a2c4e9f1b30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("businesses", sa.Column("context_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("businesses", "context_text")
