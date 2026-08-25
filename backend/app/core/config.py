"""Application configuration.

All settings are environment-driven (12-factor). Values below are safe
development defaults so the project runs immediately after clone; every one
of them can be overridden through the environment or a `.env` file.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # --- Application -----------------------------------------------------
    APP_NAME: str = "Webvory"
    APP_DESCRIPTION: str = "Internal Task & Management Dashboard"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # --- Database --------------------------------------------------------
    # SQLite by default so the project runs with zero setup.
    # For PostgreSQL, set:
    #   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/webvory
    DATABASE_URL: str = "sqlite:///./webvory.db"

    # --- Auth ------------------------------------------------------------
    JWT_SECRET: str = "dev-secret-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # --- CORS ------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- External API integration ---------------------------------------
    EXTERNAL_API_BASE_URL: str = "https://jsonplaceholder.typicode.com"
    EXTERNAL_API_KEY: str | None = None
    EXTERNAL_API_TIMEOUT_SECONDS: float = 8.0
    EXTERNAL_API_MAX_RETRIES: int = 3
    EXTERNAL_API_BACKOFF_SECONDS: float = 0.5
    EXTERNAL_API_CACHE_TTL_SECONDS: int = 300
    EXTERNAL_API_RATE_LIMIT_PER_MINUTE: int = 30

    # --- Pagination ------------------------------------------------------
    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 100

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so the .env file is parsed exactly once per process."""
    return Settings()


settings = get_settings()
