from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.database_connection import get_session
from todo_listercise.flag.dependencies import get_flag_service
from todo_listercise.flag.service import FlagService
from todo_listercise.list_item.service import ListItemService


def get_list_item_service(
    session: Annotated[AsyncSession, Depends(get_session)],
    flags: Annotated[FlagService, Depends(get_flag_service)],
) -> ListItemService:
    return ListItemService(session, flags)
