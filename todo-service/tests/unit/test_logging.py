import pytest

from todo_listercise.logging import configure_logging


class TestConfigureLogging:
    def test_rejects_unknown_level(self) -> None:
        with pytest.raises(ValueError, match="unsupported log level"):
            configure_logging("verbose")
