from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.errors import NotFoundError
from todo_listercise.flag.schemas import FlagUpdate
from todo_listercise.flag.service import FlagService


def _service(flag: object | None) -> tuple[FlagService, MagicMock]:
    session = MagicMock(spec=AsyncSession)
    session.get = AsyncMock(return_value=flag)
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    return FlagService(session), session


class TestIsEnabled:
    async def test_caches_db_result(self) -> None:
        service, session = _service(MagicMock(enabled=True))
        assert await service.is_enabled("priorities") is True
        assert await service.is_enabled("priorities") is True
        session.get.assert_awaited_once()

    async def test_missing_flag_is_false(self) -> None:
        service, _session = _service(None)
        assert await service.is_enabled("priorities") is False

    async def test_refetches_after_ttl(self) -> None:
        clock = {"now": 0.0}
        service, session = _service(MagicMock(enabled=True))
        with patch("todo_listercise.flag.service.monotonic", lambda: clock["now"]):
            await service.is_enabled("priorities")
            clock["now"] = FlagService._ttl_seconds + 0.1
            await service.is_enabled("priorities")
        assert session.get.await_count == 2


class TestInvalidate:
    async def test_one_key_leaves_others(self) -> None:
        service, session = _service(MagicMock(enabled=True))
        await service.is_enabled("priorities")
        session.get = AsyncMock(return_value=MagicMock(enabled=False))
        await service.is_enabled("other")
        FlagService.invalidate("priorities")
        session.get.reset_mock()
        assert await service.is_enabled("other") is False
        session.get.assert_not_awaited()


class TestUpdate:
    async def test_unknown_key_raises(self) -> None:
        service, _session = _service(None)
        with pytest.raises(NotFoundError, match="flag"):
            await service.update("nope", FlagUpdate(enabled=True))

    async def test_invalidates_cache(self) -> None:
        flag = MagicMock(enabled=False)
        service, session = _service(flag)
        await service.is_enabled("priorities")
        flag.enabled = True
        await service.update("priorities", FlagUpdate(enabled=True))
        session.get.reset_mock()
        session.get.return_value = flag
        assert await service.is_enabled("priorities") is True
        session.get.assert_awaited_once()
