from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.errors import NotFoundError
from todo_listercise.list_item.model import ListItem, Priority
from todo_listercise.list_item.schemas import ListItemCreate, ListItemUpdate
from todo_listercise.list_item.service import ListItemService


class FakeFlags:
    def __init__(self, enabled: bool) -> None:
        self._enabled = enabled

    async def is_enabled(self, key: str) -> bool:
        return self._enabled


def _service(enabled: bool, *, item: ListItem | None = None) -> ListItemService:
    session = MagicMock(spec=AsyncSession)
    session.add = MagicMock()
    session.get = AsyncMock(return_value=item)
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    return ListItemService(session, FakeFlags(enabled))


class TestCreate:
    async def test_ignores_priority_when_flag_off(self) -> None:
        service = _service(enabled=False)
        item = await service.create(
            ListItemCreate(title="buy milk", priority=Priority.highest),
        )
        assert item.priority == int(Priority.medium)

    async def test_uses_requested_priority_when_flag_on(self) -> None:
        service = _service(enabled=True)
        item = await service.create(
            ListItemCreate(title="buy milk", priority=Priority.highest),
        )
        assert item.priority == int(Priority.highest)

    async def test_defaults_priority_when_omitted(self) -> None:
        service = _service(enabled=True)
        item = await service.create(ListItemCreate(title="buy milk"))
        assert item.priority == int(Priority.medium)


class TestUpdate:
    async def test_keeps_existing_priority_when_flag_off(self) -> None:
        existing = ListItem(title="buy milk", priority=int(Priority.highest))
        service = _service(enabled=False, item=existing)
        item = await service.update(uuid4(), ListItemUpdate(priority=Priority.lowest))
        assert item.priority == int(Priority.highest)

    async def test_applies_priority_when_flag_on(self) -> None:
        existing = ListItem(title="buy milk", priority=int(Priority.highest))
        service = _service(enabled=True, item=existing)
        item = await service.update(uuid4(), ListItemUpdate(priority=Priority.lowest))
        assert item.priority == int(Priority.lowest)

    async def test_missing_item_raises(self) -> None:
        service = _service(enabled=True)
        with pytest.raises(NotFoundError, match="list_item"):
            await service.update(uuid4(), ListItemUpdate(title="gone"))
