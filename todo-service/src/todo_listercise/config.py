from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", extra="ignore")

    database_url: str = "postgresql+asyncpg://todo:todo@localhost:5432/todo_listercise"
    log_level: str = "info"


def get_settings() -> Settings:
    return Settings()
