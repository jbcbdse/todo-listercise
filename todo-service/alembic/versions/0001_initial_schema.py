"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-16

"""

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "list_item",
        sa.Column(
            "id",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column(
            "completed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.SmallInteger(),
            server_default=sa.text("3"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "priority BETWEEN 1 AND 5",
            name="list_item_priority_check",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "flag",
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("key"),
    )
    op.execute(
        sa.text(
            "INSERT INTO flag (key, enabled, description) "
            "VALUES ('priorities', false, 'Show priority on todos')"
        )
    )


def downgrade() -> None:
    op.drop_table("flag")
    op.drop_table("list_item")
