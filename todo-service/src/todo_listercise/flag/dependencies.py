from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.database_connection import get_session
from todo_listercise.flag.service import FlagService


def get_flag_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> FlagService:
    return FlagService(session)
