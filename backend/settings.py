
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "CHANGE_ME_SUPER_SECRET"
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None
    SMS_PROVIDER: str | None = None
    SMS_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
