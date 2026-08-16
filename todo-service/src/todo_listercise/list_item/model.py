from datetime import UTC, datetime
from enum import IntEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    SmallInteger,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from todo_listercise.database_connection.orm import Base


class Priority(IntEnum):
    highest = 1
    high = 2
    medium = 3
    low = 4
    lowest = 5


class ListItem(Base):
    __tablename__ = "list_item"
    __table_args__ = (
        CheckConstraint(
            "priority BETWEEN 1 AND 5",
            name="list_item_priority_check",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    title: Mapped[str] = mapped_column(Text)
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
    )
    priority: Mapped[int] = mapped_column(
        SmallInteger,
        default=Priority.medium,
        server_default=text("3"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        server_default=func.now(),
    )
