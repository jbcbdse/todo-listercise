from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.errors import NotFoundError
from todo_listercise.flag.service import FlagKey, FlagLookup
from todo_listercise.list_item.model import ListItem, Priority
from todo_listercise.list_item.schemas import (
    ListItemCreate,
    ListItemUpdate,
    StatusFilter,
)


class ListItemService:
    def __init__(self, session: AsyncSession, flags: FlagLookup) -> None:
        self._session = session
        self._flags = flags

    async def list(
        self,
        status: StatusFilter | None = None,
        priority: Priority | None = None,
    ) -> list[ListItem]:
        stmt = select(ListItem).order_by(ListItem.created_at)
        if status is StatusFilter.completed:
            stmt = stmt.where(ListItem.completed.is_(True))
        elif status is StatusFilter.incomplete:
            stmt = stmt.where(ListItem.completed.is_(False))
        if priority is not None:
            stmt = stmt.where(ListItem.priority == int(priority))
        result = await self._session.scalars(stmt)
        return list(result.all())

    async def create(self, body: ListItemCreate) -> ListItem:
        item = ListItem(
            title=body.title,
            priority=await self._priority_for_write(
                body.priority,
                existing=int(Priority.medium),
            ),
        )
        self._session.add(item)
        await self._session.flush()
        await self._session.refresh(item)
        return item

    async def update(self, item_id: UUID, body: ListItemUpdate) -> ListItem:
        item = await self._get(item_id)
        if body.title is not None:
            item.title = body.title
        if body.completed is not None:
            item.completed = body.completed
        if body.priority is not None:
            item.priority = await self._priority_for_write(
                body.priority,
                existing=item.priority,
            )
        await self._session.flush()
        await self._session.refresh(item)
        return item

    async def delete(self, item_id: UUID) -> None:
        item = await self._get(item_id)
        await self._session.delete(item)
        await self._session.flush()

    async def _get(self, item_id: UUID) -> ListItem:
        item = await self._session.get(ListItem, item_id)
        if item is None:
            raise NotFoundError("list_item", str(item_id))
        return item

    async def _priority_for_write(
        self,
        requested: Priority | None,
        existing: int,
    ) -> int:
        if requested is None or not await self._flags.is_enabled(FlagKey.PRIORITIES):
            return existing
        return int(requested)
