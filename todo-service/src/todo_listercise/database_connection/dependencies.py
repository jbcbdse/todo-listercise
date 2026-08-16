from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from todo_listercise.database_connection.database import Database


def get_database(request: Request) -> Database:
    database = request.app.state.database
    if not isinstance(database, Database):
        msg = "database is not configured"
        raise TypeError(msg)
    return database


async def get_session(
    database: Annotated[Database, Depends(get_database)],
) -> AsyncIterator[AsyncSession]:
    async with database.session() as session:
        yield session
