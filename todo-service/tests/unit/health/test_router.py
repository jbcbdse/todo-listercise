from unittest.mock import AsyncMock, MagicMock

from sqlalchemy.exc import SQLAlchemyError

from todo_listercise.database_connection import Database
from todo_listercise.health.router import readyz


class TestReadyz:
    async def test_ok_when_ping_succeeds(self) -> None:
        database = MagicMock(spec=Database)
        database.ping = AsyncMock()
        response = await readyz(database)
        assert response.status_code == 200

    async def test_unavailable_when_ping_fails(self) -> None:
        database = MagicMock(spec=Database)
        database.ping = AsyncMock(side_effect=OSError)
        response = await readyz(database)
        assert response.status_code == 503
        assert response.body == b'{"status":"unavailable"}'

    async def test_unavailable_when_database_errors(self) -> None:
        database = MagicMock(spec=Database)
        database.ping = AsyncMock(side_effect=SQLAlchemyError)
        response = await readyz(database)
        assert response.status_code == 503
