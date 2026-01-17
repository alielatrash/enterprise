"""Application configuration"""

import os
from pathlib import Path
from typing import Optional

import yaml
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Timezone
    tz: str = "Africa/Cairo"

    # Database
    database_url: str = "sqlite:///./mena_digest.db"

    # Gmail API
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    gmail_label: str = "Enterprise-Forward"
    gmail_credentials_path: str = "credentials.json"
    gmail_token_path: str = "token.json"

    # Reuters API
    reuters_api_key: Optional[str] = None

    # LLM
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Email delivery
    sendgrid_api_key: Optional[str] = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    digest_email_to: Optional[str] = None

    # WhatsApp (Twilio)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_from: Optional[str] = None
    twilio_whatsapp_to: Optional[str] = None

    # Telegram
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None

    # Scheduler
    digest_schedule_hour: int = 8
    digest_schedule_minute: int = 30

    # App settings
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


def load_sources_config() -> dict:
    """Load sources configuration from YAML file"""
    config_path = Path("sources.yaml")
    if not config_path.exists():
        return {"sources": []}

    with open(config_path, "r") as f:
        return yaml.safe_load(f)


settings = Settings()
