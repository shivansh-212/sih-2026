"""
Environment configuration using pydantic-settings.
All settings are read from environment variables or .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings — loaded from environment variables / .env file."""

    # Database
    DATABASE_URL: str = "postgresql+psycopg://bhu_id:bhu_id@localhost:5432/bhu_id"

    # JWT Authentication
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: str = "https://sih-2026-gray-two.vercel.app,https://sih-2026-nvqm.onrender.com,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # AI & Gemini API Configuration (optional for satellite visual analysis)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"


    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_PROJECT_REF: str = ""

    # Seed credentials (development only — never commit real passwords)
    ADMIN_EMAIL: str = "admin@bhu-id.local"
    ADMIN_PASSWORD: str = "admin123"
    USER_EMAIL: str = "user@bhu-id.local"
    USER_PASSWORD: str = "user123"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list, stripping trailing slashes."""
        origins = []
        for origin in self.CORS_ORIGINS.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                origins.append(cleaned)
        return origins

    model_config = {
        "env_file": [".env", "backend/.env", "sih/.env"],
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


# Singleton settings instance
settings = Settings()
