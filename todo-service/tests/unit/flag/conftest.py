from collections.abc import Iterator

import pytest

from todo_listercise.flag.service import FlagService


@pytest.fixture(autouse=True)
def _clear_flag_cache() -> Iterator[None]:
    FlagService.invalidate()
    yield
    FlagService.invalidate()
