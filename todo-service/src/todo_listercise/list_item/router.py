from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from todo_listercise.list_item.dependencies import get_list_item_service
from todo_listercise.list_item.model import ListItem, Priority
from todo_listercise.list_item.schemas import (
    ListItemCreate,
    ListItemRead,
    ListItemUpdate,
    StatusFilter,
)
from todo_listercise.list_item.service import ListItemService

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[ListItemRead])
async def list_items(
    items: Annotated[ListItemService, Depends(get_list_item_service)],
    status: StatusFilter | None = None,
    priority: Priority | None = None,
) -> list[ListItem]:
    return await items.list(status=status, priority=priority)


@router.post("", response_model=ListItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    body: ListItemCreate,
    items: Annotated[ListItemService, Depends(get_list_item_service)],
) -> ListItem:
    return await items.create(body)


@router.patch("/{item_id}", response_model=ListItemRead)
async def update_item(
    item_id: UUID,
    body: ListItemUpdate,
    items: Annotated[ListItemService, Depends(get_list_item_service)],
) -> ListItem:
    return await items.update(item_id, body)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: UUID,
    items: Annotated[ListItemService, Depends(get_list_item_service)],
) -> Response:
    await items.delete(item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
