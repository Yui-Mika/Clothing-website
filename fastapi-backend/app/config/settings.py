from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str = "veloura_db"
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    
    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Email Configuration (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "Veloura Shop"
    
    # Email Configuration (for fastapi-mail)
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: Optional[str] = None
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_TLS: str = "true"
    MAIL_SSL: str = "false"
    MAIL_FROM_NAME: str = "Veloura Shop"
    
    # Resend API (alternative to SMTP)
    RESEND_API_KEY: Optional[str] = None
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Backend URL (for email verification links)
    BACKEND_URL: str = "http://localhost:8000"
    
    # Admin credentials
    ADMIN_EMAIL: str = "admin@veloura.com"
    ADMIN_PASSWORD: str = "admin123"
    
    # Delivery charges
    DELIVERY_CHARGES: float = 10.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
