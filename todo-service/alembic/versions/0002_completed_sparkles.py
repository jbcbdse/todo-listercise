"""seed completed_sparkles flag

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-16

"""

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "INSERT INTO flag (key, enabled, description) "
            "VALUES ('completed_sparkles', false, "
            "'Sparkles when a todo is completed')"
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM flag WHERE key = 'completed_sparkles'"))
