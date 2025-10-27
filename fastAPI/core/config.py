from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017/shopprr"
    jwt_secret: str = "change-me"
    admin_email: str = "admin@example.com"
    admin_pass: str = "admin"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    cors_origins: List[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False)


settings = Settings()


