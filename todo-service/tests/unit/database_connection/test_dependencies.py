from unittest.mock import MagicMock

import pytest
from fastapi import Request

from todo_listercise.database_connection.dependencies import get_database


class TestGetDatabase:
    def test_rejects_unconfigured(self) -> None:
        request = MagicMock(spec=Request)
        request.app.state.database = object()
        with pytest.raises(TypeError, match="database is not configured"):
            get_database(request)
