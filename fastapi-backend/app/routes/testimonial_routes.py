from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from app.models.testimonial import TestimonialCreate, TestimonialUpdate
from app.config.database import get_collection
from app.middleware.auth_admin import auth_staff
from app.middleware.auth_user import auth_user
from app.config.cloudinary import upload_image
from bson import ObjectId
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/list", response_model=dict)
async def get_all_testimonials(approved_only: bool = True):
    """Get all testimonials"""
    testimonials_collection = await get_collection("testimonials")
    
    query = {"isApproved": True} if approved_only else {}
    testimonials = await testimonials_collection.find(query).sort("createdAt", -1).to_list(length=None)
    
    for testimonial in testimonials:
        testimonial["_id"] = str(testimonial["_id"])
    
    return {
        "success": True,
        "testimonials": testimonials
    }

@router.get("/{testimonial_id}", response_model=dict)
async def get_testimonial(testimonial_id: str):
    """Get single testimonial"""
    testimonials_collection = await get_collection("testimonials")
    
    testimonial = await testimonials_collection.find_one({"_id": ObjectId(testimonial_id)})
    
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonial not found"
        )
    
    testimonial["_id"] = str(testimonial["_id"])
    
    return {
        "success": True,
        "testimonial": testimonial
    }

@router.post("/add", response_model=dict)
async def add_testimonial(
    name: str = Form(...),
    role: Optional[str] = Form("Customer"),
    rating: int = Form(...),
    comment: str = Form(...),
    image: Optional[UploadFile] = File(None),
    request: Request = None
):
    """Add new testimonial (can be by customer or staff)"""
    testimonials_collection = await get_collection("testimonials")
    
    # Validate rating
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    # Upload image if provided
    image_url = None
    if image:
        img_content = await image.read()
        image_url = await upload_image(img_content, folder="veloura/testimonials")
    
    # Check if user is authenticated to auto-approve
    is_approved = False
    try:
        # Try to check if admin/staff
        from app.middleware.auth_admin import auth_staff
        staff = await auth_staff(request)
        is_approved = True  # Auto-approve if added by staff
    except:
        pass
    
    # Create testimonial
    testimonial_doc = {
        "name": name,
        "role": role,
        "rating": rating,
        "comment": comment,
        "image": image_url,
        "isApproved": is_approved,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await testimonials_collection.insert_one(testimonial_doc)
    
    return {
        "success": True,
        "message": "Testimonial submitted successfully" if not is_approved else "Testimonial added successfully",
        "testimonialId": str(result.inserted_id)
    }

@router.put("/{testimonial_id}/approve", response_model=dict)
async def approve_testimonial(testimonial_id: str, staff: dict = Depends(auth_staff)):
    """Approve testimonial (Staff/Admin only)"""
    testimonials_collection = await get_collection("testimonials")
    
    result = await testimonials_collection.update_one(
        {"_id": ObjectId(testimonial_id)},
        {"$set": {"isApproved": True, "updatedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonial not found"
        )
    
    return {
        "success": True,
        "message": "Testimonial approved successfully"
    }

@router.delete("/{testimonial_id}", response_model=dict)
async def delete_testimonial(testimonial_id: str, staff: dict = Depends(auth_staff)):
    """Delete testimonial (Staff/Admin only)"""
    testimonials_collection = await get_collection("testimonials")
    
    result = await testimonials_collection.delete_one({"_id": ObjectId(testimonial_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonial not found"
        )
    
    return {
        "success": True,
        "message": "Testimonial deleted successfully"
    }
