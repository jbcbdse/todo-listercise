from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import perf_counter

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from todo_listercise.config import get_settings
from todo_listercise.database_connection import Database
from todo_listercise.errors import NotFoundError
from todo_listercise.flag.router import router as flags_router
from todo_listercise.health.router import router as health_router
from todo_listercise.list_item.router import router as list_item_router
from todo_listercise.logging import configure_logging

logger = structlog.get_logger("todo_listercise")


class RequestLogMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start = perf_counter()
        status_code = 500

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = int(message["status"])
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            path = scope.get("path", "")
            method = scope.get("method", "")
            duration_ms = round((perf_counter() - start) * 1000, 2)
            logger.info(
                "request",
                method=method,
                path=path,
                status_code=status_code,
                duration_ms=duration_ms,
            )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    app.state.database = Database(settings.database_url)
    yield
    await app.state.database.dispose()


def not_found_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


def create_app() -> FastAPI:
    application = FastAPI(title="todo-service", lifespan=lifespan)
    application.add_middleware(RequestLogMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_exception_handler(NotFoundError, not_found_handler)
    application.include_router(health_router)
    application.include_router(list_item_router)
    application.include_router(flags_router)
    return application


app = create_app()
