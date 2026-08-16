from typing import Annotated

from fastapi import APIRouter, Depends

from todo_listercise.flag.dependencies import get_flag_service
from todo_listercise.flag.model import Flag
from todo_listercise.flag.schemas import FlagRead, FlagUpdate
from todo_listercise.flag.service import FlagService

router = APIRouter(prefix="/flags", tags=["flags"])


@router.get("", response_model=list[FlagRead])
async def list_flags(
    flags: Annotated[FlagService, Depends(get_flag_service)],
) -> list[Flag]:
    return await flags.list()


@router.put("/{key}", response_model=FlagRead)
async def update_flag(
    key: str,
    body: FlagUpdate,
    flags: Annotated[FlagService, Depends(get_flag_service)],
) -> Flag:
    return await flags.update(key, body)
