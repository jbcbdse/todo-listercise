from unittest.mock import MagicMock

from fastapi import Request

from todo_listercise.errors import NotFoundError
from todo_listercise.main import not_found_handler


class TestNotFoundHandler:
    def test_returns_404(self) -> None:
        response = not_found_handler(
            MagicMock(spec=Request),
            NotFoundError("list_item", "missing"),
        )
        assert response.status_code == 404
        assert b"list_item" in bytes(response.body)
