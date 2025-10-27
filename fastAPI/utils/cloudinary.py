import cloudinary
import cloudinary.uploader
from app.core.config import settings


def setup_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.__dict__.get("cldn_name") or "",
        api_key=settings.__dict__.get("cldn_api_key") or "",
        api_secret=settings.__dict__.get("cldn_secret_key") or "",
        secure=True,
    )


def upload_image(path: str) -> str:
    result = cloudinary.uploader.upload(path, resource_type="image")
    return result["secure_url"]


