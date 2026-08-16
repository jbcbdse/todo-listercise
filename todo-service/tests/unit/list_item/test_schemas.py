import pytest
from pydantic import ValidationError

from todo_listercise.list_item.model import Priority
from todo_listercise.list_item.schemas import ListItemCreate, ListItemUpdate


class TestListItemCreate:
    def test_rejects_empty_title(self) -> None:
        with pytest.raises(ValidationError):
            ListItemCreate(title="")

    def test_rejects_title_over_max_length(self) -> None:
        with pytest.raises(ValidationError):
            ListItemCreate(title="x" * 501)

    def test_rejects_priority_outside_1_to_5(self) -> None:
        with pytest.raises(ValidationError):
            ListItemCreate.model_validate({"title": "buy milk", "priority": 0})
        with pytest.raises(ValidationError):
            ListItemCreate.model_validate({"title": "buy milk", "priority": 6})

    def test_coerces_priority_int(self) -> None:
        body = ListItemCreate.model_validate({"title": "buy milk", "priority": 1})
        assert body.priority is Priority.highest

    def test_omits_priority(self) -> None:
        body = ListItemCreate(title="buy milk")
        assert body.priority is None


class TestListItemUpdate:
    def test_fields_are_optional(self) -> None:
        body = ListItemUpdate()
        assert body.title is None
        assert body.completed is None
        assert body.priority is None

    def test_rejects_empty_title(self) -> None:
        with pytest.raises(ValidationError):
            ListItemUpdate(title="")
