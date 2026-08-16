import os
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from testcontainers.community.postgres import PostgresContainer

from todo_listercise.database_connection import Database
from todo_listercise.flag.service import FlagService
from todo_listercise.main import create_app

SERVICE_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def postgres_url() -> Iterator[str]:
    try:
        with PostgresContainer("postgres:16-alpine") as postgres:
            yield postgres.get_connection_url(driver="asyncpg")
    except Exception as exc:
        pytest.skip(f"e2e requires a running Docker daemon: {exc}")


@pytest.fixture(scope="session")
def migrated_url(postgres_url: str) -> str:
    os.environ["DATABASE_URL"] = postgres_url
    alembic_cfg = Config(str(SERVICE_ROOT / "alembic.ini"))
    command.upgrade(alembic_cfg, "head")
    return postgres_url


async def _reset_state(application: FastAPI) -> None:
    database = application.state.database
    if not isinstance(database, Database):
        msg = "database is not configured"
        raise TypeError(msg)
    async with database.session() as session:
        await session.execute(text("TRUNCATE TABLE list_item"))
        await session.execute(
            text("UPDATE flag SET enabled = false WHERE key = 'priorities'"),
        )
    FlagService.invalidate()


@pytest.fixture
async def client(
    migrated_url: str,
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncIterator[AsyncClient]:
    monkeypatch.setenv("DATABASE_URL", migrated_url)
    FlagService.invalidate()
    application = create_app()
    async with application.router.lifespan_context(application):
        await _reset_state(application)
        transport = ASGITransport(app=application)
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as async_client:
            yield async_client
    FlagService.invalidate()
