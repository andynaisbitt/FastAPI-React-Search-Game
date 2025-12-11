"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "JFGI"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # Database (SQLite for development, PostgreSQL for production)
    DATABASE_URL: str = "sqlite:///./jfgi_dev.db"  # Use SQLite for local dev

    # Security
    SECRET_KEY: str = "change-this-to-a-secure-random-string-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (alt)
        "http://localhost:3000",  # Alternative dev port
        "https://jfgi.app",
        "https://www.jfgi.app"
    ]

    # Rate Limiting (relaxed for development)
    RATE_LIMIT_URLS_PER_HOUR: int = 100
    RATE_LIMIT_GAMES_PER_HOUR: int = 1000

    # External APIs
    GOOGLE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_CX: str = ""

    # Redis (Optional - for caching)
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
