"""add TOMAN as a supported currency, distinct from IRR

Toman and Rial are two different, non-interchangeable currencies in
LedgerAI's model (a fixed 10:1 unit relationship, not a market exchange
rate) — Persian-facing businesses can now be ledgered in TOMAN directly
instead of always being forced into IRR with a display-only relabel.

Revision ID: 7a2c4e9f1b30
Revises: 3f1a9c2b6e10
Create Date: 2026-09-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7a2c4e9f1b30"
down_revision: Union[str, Sequence[str], None] = "3f1a9c2b6e10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # "TOMAN" is 5 characters — both currency columns were VARCHAR(3).
    op.alter_column("businesses", "base_currency", type_=sa.String(length=5))
    op.alter_column("journal_entries", "currency", type_=sa.String(length=5))

    op.drop_constraint("ck_journal_entries_currency", "journal_entries", type_="check")
    op.create_check_constraint(
        "ck_journal_entries_currency",
        "journal_entries",
        "currency IN ('IRR', 'TOMAN', 'USD', 'EUR', 'GBP')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_journal_entries_currency", "journal_entries", type_="check")
    op.create_check_constraint(
        "ck_journal_entries_currency",
        "journal_entries",
        "currency IN ('IRR', 'USD', 'EUR', 'GBP')",
    )

    op.alter_column("businesses", "base_currency", type_=sa.String(length=3))
    op.alter_column("journal_entries", "currency", type_=sa.String(length=3))
