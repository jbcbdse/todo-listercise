from __future__ import annotations

import logging
from typing import Final

import structlog

_STD_LEVELS: Final[dict[str, int]] = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warning": logging.WARNING,
    "error": logging.ERROR,
    "critical": logging.CRITICAL,
}


def configure_logging(log_level: str = "info") -> None:
    level_name = log_level.lower()
    if level_name not in _STD_LEVELS:
        msg = f"unsupported log level: {log_level}"
        raise ValueError(msg)
    level = _STD_LEVELS[level_name]

    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True, key="timestamp")
    shared: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        timestamper,
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ]
    structlog.configure(
        processors=shared,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.processors.EventRenamer("message"),
            structlog.processors.JSONRenderer(),
        ],
    )
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uv_logger = logging.getLogger(name)
        uv_logger.handlers.clear()
        uv_logger.propagate = True
