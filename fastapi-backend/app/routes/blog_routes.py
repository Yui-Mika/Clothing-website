from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.models.blog import BlogCreate, BlogUpdate
from app.config.database import get_collection
from app.middleware.auth_admin import auth_staff
from app.config.cloudinary import upload_image
from bson import ObjectId
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/list", response_model=dict)
async def get_all_blogs(published_only: bool = True):
    """Get all blogs"""
    blogs_collection = await get_collection("blogs")
    
    query = {"isPublished": True} if published_only else {}
    blogs = await blogs_collection.find(query).sort("createdAt", -1).to_list(length=None)
    
    for blog in blogs:
        blog["_id"] = str(blog["_id"])
    
    return {
        "success": True,
        "blogs": blogs
    }

@router.get("/{blog_id}", response_model=dict)
async def get_blog(blog_id: str):
    """Get single blog"""
    blogs_collection = await get_collection("blogs")
    
    blog = await blogs_collection.find_one({"_id": ObjectId(blog_id)})
    
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài viết"
        )
    
    blog["_id"] = str(blog["_id"])
    
    return {
        "success": True,
        "blog": blog
    }

@router.post("/add", response_model=dict)
async def add_blog(
    title: str = Form(...),
    category: str = Form(...),
    content: str = Form(...),
    author: Optional[str] = Form("Admin"),
    image: Optional[UploadFile] = File(None),
    staff: dict = Depends(auth_staff)
):
    """Add new blog (Staff/Admin only)"""
    blogs_collection = await get_collection("blogs")
    
    # Upload image if provided
    image_url = None
    if image:
        img_content = await image.read()
        image_url = await upload_image(img_content, folder="veloura/blogs")
    
    # Create blog
    blog_doc = {
        "title": title,
        "category": category,
        "content": content,
        "author": author,
        "image": image_url,
        "isPublished": True,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await blogs_collection.insert_one(blog_doc)
    
    return {
        "success": True,
        "message": "Thêm bài viết thành công",
        "blogId": str(result.inserted_id)
    }

@router.put("/{blog_id}", response_model=dict)
async def update_blog(
    blog_id: str,
    title: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    staff: dict = Depends(auth_staff)
):
    """Update blog (Staff/Admin only)"""
    blogs_collection = await get_collection("blogs")
    
    # Check if blog exists
    blog = await blogs_collection.find_one({"_id": ObjectId(blog_id)})
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài viết"
        )
    
    update_data = {}
    
    if title:
        update_data["title"] = title
    if category:
        update_data["category"] = category
    if content:
        update_data["content"] = content
    if author:
        update_data["author"] = author
    
    # Upload new image if provided
    if image:
        img_content = await image.read()
        image_url = await upload_image(img_content, folder="veloura/blogs")
        update_data["image"] = image_url
    
    update_data["updatedAt"] = datetime.utcnow()
    
    await blogs_collection.update_one(
        {"_id": ObjectId(blog_id)},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Cập nhật bài viết thành công"
    }

@router.delete("/{blog_id}", response_model=dict)
async def delete_blog(blog_id: str, staff: dict = Depends(auth_staff)):
    """Delete blog (Staff/Admin only)"""
    blogs_collection = await get_collection("blogs")
    
    result = await blogs_collection.delete_one({"_id": ObjectId(blog_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài viết"
        )
    
    return {
        "success": True,
        "message": "Xóa bài viết thành công"
    }

@router.put("/{blog_id}/publish", response_model=dict)
async def toggle_publish_blog(blog_id: str, staff: dict = Depends(auth_staff)):
    """Toggle blog publish status (Staff/Admin only)"""
    blogs_collection = await get_collection("blogs")
    
    blog = await blogs_collection.find_one({"_id": ObjectId(blog_id)})
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài viết"
        )
    
    new_status = not blog.get("isPublished", True)
    
    await blogs_collection.update_one(
        {"_id": ObjectId(blog_id)},
        {"$set": {"isPublished": new_status, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": f"Blog {'published' if new_status else 'unpublished'} successfully"
    }
