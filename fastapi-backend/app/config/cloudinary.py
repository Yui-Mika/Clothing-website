import cloudinary
import cloudinary.uploader
from app.config.settings import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

async def upload_image(file_content: bytes, folder: str = "veloura") -> str:
    """
    Upload image to Cloudinary
    Returns the secure URL of uploaded image
    """
    try:
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="image"
        )
        return result.get("secure_url")
    except Exception as e:
        raise Exception(f"Failed to upload image: {str(e)}")

async def delete_image(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        raise Exception(f"Failed to delete image: {str(e)}")
