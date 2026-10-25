from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", extra="ignore")

    database_url: str = "postgresql+asyncpg://todo:todo@localhost:5433/todo_listercise"
    log_level: str = "info"
    otel_exporter_otlp_endpoint: str | None = None
    otel_service_name: str = "todo-service"


def get_settings() -> Settings:
    return Settings()
