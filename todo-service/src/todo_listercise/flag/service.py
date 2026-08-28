from enum import StrEnum
from time import monotonic
from typing import ClassVar, Protocol

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.errors import NotFoundError
from todo_listercise.flag.model import Flag
from todo_listercise.flag.schemas import FlagUpdate
from todo_listercise.telemetry import get_metrics


class FlagKey(StrEnum):
    PRIORITIES = "priorities"
    COMPLETED_SPARKLES = "completed_sparkles"


class FlagLookup(Protocol):
    async def is_enabled(self, key: str) -> bool: ...


class FlagService:
    _cache: ClassVar[dict[str, tuple[bool, float]]] = {}
    _ttl_seconds: ClassVar[float] = 5.0

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def is_enabled(self, key: str) -> bool:
        get_metrics().flag_evaluations.add(1, {"flag": key})
        cached = self._read_cache(key)
        if cached is not None:
            return cached
        flag = await self._session.get(Flag, key)
        enabled = flag.enabled if flag is not None else False
        self._write_cache(key, enabled=enabled)
        return enabled

    async def list(self) -> list[Flag]:
        result = await self._session.scalars(select(Flag).order_by(Flag.key))
        return list(result.all())

    async def update(self, key: str, body: FlagUpdate) -> Flag:
        flag = await self._session.get(Flag, key)
        if flag is None:
            raise NotFoundError("flag", key)
        flag.enabled = body.enabled
        await self._session.flush()
        await self._session.refresh(flag)
        self.invalidate(key)
        return flag

    @classmethod
    def invalidate(cls, key: str | None = None) -> None:
        if key is None:
            cls._cache.clear()
            return
        cls._cache.pop(key, None)

    def _read_cache(self, key: str) -> bool | None:
        hit = self._cache.get(key)
        if hit is None:
            return None
        enabled, expires_at = hit
        if monotonic() >= expires_at:
            self._cache.pop(key, None)
            return None
        return enabled

    def _write_cache(self, key: str, *, enabled: bool) -> None:
        self._cache[key] = (enabled, monotonic() + self._ttl_seconds)
