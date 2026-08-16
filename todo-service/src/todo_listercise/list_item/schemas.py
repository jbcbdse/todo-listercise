from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from todo_listercise.list_item.model import Priority


class StatusFilter(StrEnum):
    completed = "completed"
    incomplete = "incomplete"


class ListItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    priority: Priority | None = None


class ListItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    completed: bool | None = None
    priority: Priority | None = None


class ListItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    completed: bool
    priority: Priority
    created_at: datetime
    updated_at: datetime
