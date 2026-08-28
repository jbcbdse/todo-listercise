from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from opentelemetry import metrics, trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

if TYPE_CHECKING:
    from fastapi import FastAPI
    from sqlalchemy.ext.asyncio import AsyncEngine

    from todo_listercise.config import Settings


class AppMetrics:
    def __init__(self) -> None:
        meter = metrics.get_meter("todo_listercise")
        self.todos_created = meter.create_counter(
            "todos_created",
            description="Todos created",
        )
        self.todos_completed = meter.create_counter(
            "todos_completed",
            description="Todos marked completed",
        )
        self.flag_evaluations = meter.create_counter(
            "flag_evaluations",
            description="Feature flag evaluations",
        )
        self.http_server_duration = meter.create_histogram(
            "http.server.duration",
            unit="s",
            description="HTTP request duration",
            explicit_bucket_boundaries_advisory=(
                0.005,
                0.01,
                0.025,
                0.05,
                0.075,
                0.1,
                0.25,
                0.5,
                0.75,
                1.0,
                2.5,
                5.0,
                10.0,
            ),
        )


class _Holder:
    metrics: AppMetrics | None = None


def get_metrics() -> AppMetrics:
    if _Holder.metrics is None:
        _Holder.metrics = AppMetrics()
    return _Holder.metrics


def setup_telemetry(app: FastAPI, engine: AsyncEngine, settings: Settings) -> None:
    endpoint = settings.otel_exporter_otlp_endpoint
    if endpoint is None or endpoint == "":
        return

    resource = Resource.create({"service.name": settings.otel_service_name})
    traces = TracerProvider(resource=resource)
    traces.add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{endpoint}/v1/traces")),
    )
    trace.set_tracer_provider(traces)

    metrics.set_meter_provider(
        MeterProvider(
            resource=resource,
            metric_readers=[
                PeriodicExportingMetricReader(
                    OTLPMetricExporter(endpoint=f"{endpoint}/v1/metrics"),
                    export_interval_millis=15_000,
                ),
            ],
        ),
    )

    logger_provider = LoggerProvider(resource=resource)
    logger_provider.add_log_record_processor(
        BatchLogRecordProcessor(OTLPLogExporter(endpoint=f"{endpoint}/v1/logs")),
    )
    set_logger_provider(logger_provider)
    logging.getLogger().addHandler(LoggingHandler(logger_provider=logger_provider))
    for name in ("opentelemetry.exporter", "opentelemetry.sdk"):
        logging.getLogger(name).propagate = False

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(engine=engine.sync_engine)
