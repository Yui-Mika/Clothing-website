from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.models.category import CategoryCreate, CategoryUpdate
from app.config.database import get_collection
from app.middleware.auth_admin import auth_staff
from app.config.cloudinary import upload_image
from bson import ObjectId
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/list", response_model=dict)
async def get_all_categories():
    """Get all active categories"""
    categories_collection = await get_collection("categories")
    
    # Query categories có inStock=True (database dùng inStock thay vì isActive)
    categories = await categories_collection.find({"inStock": True}).sort("order", 1).to_list(length=None)
    
    for category in categories:
        category["_id"] = str(category["_id"])
    
    return {
        "success": True,
        "categories": categories
    }

@router.get("/{category_id}", response_model=dict)
async def get_category(category_id: str):
    """Get single category"""
    categories_collection = await get_collection("categories")
    
    # Query với inStock=True thay vì isActive
    category = await categories_collection.find_one({"_id": ObjectId(category_id), "inStock": True})
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy danh mục"
        )
    
    category["_id"] = str(category["_id"])
    
    return {
        "success": True,
        "category": category
    }

@router.get("/slug/{slug}", response_model=dict)
async def get_category_by_slug(slug: str):
    """Get single category by slug"""
    categories_collection = await get_collection("categories")
    
    # Query với slug và inStock=True
    category = await categories_collection.find_one({"slug": slug, "inStock": True})
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy danh mục"
        )
    
    category["_id"] = str(category["_id"])
    
    return {
        "success": True,
        "category": category
    }

@router.post("/add", response_model=dict)
async def add_category(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    staff: dict = Depends(auth_staff)
):
    """Add new category (Staff/Admin only)"""
    categories_collection = await get_collection("categories")
    
    # Check if category already exists
    existing = await categories_collection.find_one({"name": name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Danh mục đã tồn tại"
        )
    
    # Upload image if provided
    image_url = None
    if image:
        content = await image.read()
        image_url = await upload_image(content, folder="veloura/categories")
    
    # Tự động tạo slug từ name
    slug = name.lower().replace(" & ", "-").replace(" ", "-").replace("&", "and")
    
    # Get the highest order number
    last_category = await categories_collection.find_one(sort=[("order", -1)])
    next_order = (last_category.get("order", 0) + 1) if last_category else 1
    
    # Create category
    category_doc = {
        "name": name,
        "slug": slug,
        "description": description,
        "image": image_url,
        "inStock": True,
        "order": next_order,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await categories_collection.insert_one(category_doc)
    
    return {
        "success": True,
        "message": "Thêm danh mục thành công",
        "categoryId": str(result.inserted_id)
    }

@router.put("/{category_id}", response_model=dict)
async def update_category(
    category_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    staff: dict = Depends(auth_staff)
):
    """Update category (Staff/Admin only)"""
    categories_collection = await get_collection("categories")
    
    # Check if category exists
    category = await categories_collection.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy danh mục"
        )
    
    update_data = {}
    
    if name:
        update_data["name"] = name
        # Tự động cập nhật slug khi đổi name
        update_data["slug"] = name.lower().replace(" & ", "-").replace(" ", "-").replace("&", "and")
    if description:
        update_data["description"] = description
    
    # Upload new image if provided
    if image:
        content = await image.read()
        image_url = await upload_image(content, folder="veloura/categories")
        update_data["image"] = image_url
    
    update_data["updatedAt"] = datetime.utcnow()
    
    await categories_collection.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Cập nhật danh mục thành công"
    }

@router.delete("/{category_id}", response_model=dict)
async def delete_category(category_id: str, staff: dict = Depends(auth_staff)):
    """Soft delete category (Staff/Admin only)"""
    categories_collection = await get_collection("categories")
    
    # Soft delete bằng cách set inStock=False
    result = await categories_collection.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": {"inStock": False, "updatedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy danh mục"
        )
    
    return {
        "success": True,
        "message": "Xóa danh mục thành công"
    }
