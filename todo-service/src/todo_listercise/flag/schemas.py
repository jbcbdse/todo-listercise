from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FlagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    enabled: bool
    description: str | None
    updated_at: datetime


class FlagUpdate(BaseModel):
    enabled: bool
