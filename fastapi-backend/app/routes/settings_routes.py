from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from app.config.database import get_collection
from app.models.settings import SettingsResponse
from bson import ObjectId

router = APIRouter()

# GET /api/settings/current - Lấy settings của năm hiện tại (public, không cần auth)
@router.get("/current", response_model=SettingsResponse)
async def get_current_settings():
    """
    Get current year's settings for shipping fee and tax rate.
    Frontend uses this endpoint to calculate order totals.
    No authentication required.
    """
    try:
        settings_collection = await get_collection("settings")
        
        # Lấy năm hiện tại
        current_year = datetime.now().year
        
        # Tìm settings của năm hiện tại và đang active
        settings = await settings_collection.find_one({
            "year": current_year,
            "isActive": True
        })
        
        # Nếu không tìm thấy settings cho năm hiện tại, trả về mặc định
        if not settings:
            # Fallback: tìm settings active gần nhất
            settings = await settings_collection.find_one(
                {"isActive": True},
                sort=[("year", -1)]  # Sắp xếp giảm dần theo năm
            )
            
            # Nếu vẫn không có, trả về giá trị mặc định
            if not settings:
                return SettingsResponse(
                    year=current_year,
                    shippingFee=10.0,
                    taxRate=0.02,
                    isActive=True,
                    createdAt=datetime.now(),
                    updatedAt=datetime.now()
                )
        
        # Chuyển đổi ObjectId sang string cho response
        settings['_id'] = str(settings['_id'])
        
        return SettingsResponse(**settings)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching current settings: {str(e)}"
        )


# GET /api/settings/{year} - Lấy settings của năm cụ thể (public)
@router.get("/{year}", response_model=SettingsResponse)
async def get_settings_by_year(year: int):
    """
    Get settings for a specific year.
    Useful for viewing historical settings or future planned settings.
    No authentication required.
    """
    try:
        settings_collection = await get_collection("settings")
        settings = await settings_collection.find_one({"year": year})
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Settings for year {year} not found"
            )
        
        settings['_id'] = str(settings['_id'])
        return SettingsResponse(**settings)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching settings: {str(e)}"
        )
