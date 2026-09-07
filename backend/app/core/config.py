"""
KarmMitra AI — Application Configuration (Member 1: Priyash)
=============================================================

INTENT:
  Centralizes all environment-dependent settings into a single validated
  object. Pydantic-settings loads from .env file automatically, so no
  teammate needs to hardcode connection strings or API keys.

WHY pydantic-settings (not os.getenv):
  - Type validation at startup: a missing DATABASE_URL crashes immediately
    with a clear error, not silently 30 seconds later during a DB call.
  - IDE autocompletion on `settings.database_url` across the entire codebase.
  - `.env` file support out of the box without python-dotenv boilerplate.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    All configuration is loaded from environment variables or a .env file.
    Docker Compose sets these in the `environment:` block of docker-compose.yml.
    For bare-metal dev, copy .env.example → .env and adjust values.
    """

    # --- Database ---
    # INTENT: asyncpg URI for SQLAlchemy async engine.
    # Docker default uses "db" hostname (container name on karmmitra_net).
    # Local dev uses "localhost".
    database_url: str

    # --- Application ---
    secret_key: str

    # --- CORS ---
    # Comma-separated string from env; parsed into list below.
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:9000"

    # --- RAG Service (Member 2: Vedansh) ---
    # INTENT: The FastAPI gateway proxies assessment generation requests
    # to Member 2's local Ollama/vLLM instance. This URL must resolve
    # correctly from wherever the gateway runs (Docker vs bare-metal).
    rag_service_url: str = "http://localhost:11434"
    rag_model_name: str = "llama3:8b"

    @property
    def cors_origins_list(self) -> List[str]:
        """
        INTENT: Convert comma-separated env string to Python list for
        CORSMiddleware's allow_origins parameter.
        """
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore", 
        case_sensitive=False
    )


# Singleton instance — imported everywhere as `from app.core.config import settings`
settings = Settings()
