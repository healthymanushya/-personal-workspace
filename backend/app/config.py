from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # No default: every environment (local .env or Render's dashboard env vars)
    # must set this explicitly, so a missing var fails startup loudly instead
    # of silently falling back to an ephemeral, per-deploy SQLite file.
    database_url: str
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    timezone: str = "Asia/Kolkata"
    cors_origins: str = "http://localhost:5173"

    admin_email: str | None = None
    admin_password: str | None = None
    admin_name: str = "Admin"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
