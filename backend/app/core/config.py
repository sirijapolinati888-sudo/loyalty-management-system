import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="allow"
    )

    APP_NAME: str = "Loyalty Points Management System - Auditable Ledger System"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database (Read from DATABASE_URL in .env, defaults to SQLite for zero-config fallback)
    DATABASE_URL: str = "sqlite+aiosqlite:///./loyalty.db"
    SYNC_DATABASE_URL: str = "sqlite:///./loyalty_sync.db"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # Security & JWT
    JWT_SECRET_KEY: str = "yottaflex-enterprise-secret-key-change-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    POINTS_EARN_THRESHOLD_INR: float = 100.0
    DEFAULT_POINTS_EXPIRY_DAYS: int = 365
    RANDOM_SEED: int = 20261022
    
    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

settings = Settings()
