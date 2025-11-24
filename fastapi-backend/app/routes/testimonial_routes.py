from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth_user import auth_user
from app.middleware.auth_admin import auth_staff
from app.models.testimonial import TestimonialCreate, TestimonialUpdate, TestimonialResponse
from app.config.database import get_collection
from datetime import datetime
from bson import ObjectId
from typing import List

router = APIRouter()

# ============================================
# USER ROUTES
# ============================================

@router.get("/my-testimonial")
async def get_my_testimonial(user = Depends(auth_user)):
    """Get current user's testimonial (if exists)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        testimonial = await testimonials_collection.find_one({"userId": user["_id"]})
        
        if not testimonial:
            return {"success": True, "testimonial": None}
        
        testimonial["_id"] = str(testimonial["_id"])
        testimonial["userId"] = str(testimonial["userId"])
        
        return {"success": True, "testimonial": testimonial}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching testimonial: {str(e)}"
        )


@router.post("/create")
async def create_testimonial(
    data: TestimonialCreate,
    user = Depends(auth_user)
):
    """Create new testimonial - AUTO fill user info from user document"""
    try:
        testimonials_collection = await get_collection("testimonials")
        users_collection = await get_collection("users")
        
        # Check if user already has a testimonial
        existing = await testimonials_collection.find_one({"userId": user["_id"]})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already submitted a review. You can edit it instead."
            )
        
        # Get user info from user collection
        user_doc = await users_collection.find_one({"_id": user["_id"]})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create testimonial with auto-filled user info
        testimonial = {
            "userId": user["_id"],
            "userName": user_doc.get("name", "Anonymous User"),
            "userAvatar": user_doc.get("avatar", "https://i.pravatar.cc/150?img=0"),
            "rating": data.rating,
            "comment": data.comment,
            "status": "pending",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await testimonials_collection.insert_one(testimonial)
        
        return {
            "success": True,
            "message": "Thank you! Your review is pending approval.",
            "testimonialId": str(result.inserted_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating testimonial: {str(e)}"
        )


@router.put("/update")
async def update_testimonial(
    data: TestimonialUpdate,
    user = Depends(auth_user)
):
    """Update pending testimonial (only if status = pending)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        # Find user's testimonial
        testimonial = await testimonials_collection.find_one({"userId": user["_id"]})
        
        if not testimonial:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy lời chứng thực"
            )
        
        # Only allow edit if status = pending
        if testimonial["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot edit approved/rejected review"
            )
        
        # Build update data
        update_data = {"updatedAt": datetime.utcnow()}
        
        if data.rating is not None:
            update_data["rating"] = data.rating
        if data.comment is not None:
            update_data["comment"] = data.comment
        
        # Update testimonial
        await testimonials_collection.update_one(
            {"userId": user["_id"]},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "Review updated! Still pending approval."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating testimonial: {str(e)}"
        )


@router.delete("/delete")
async def delete_my_testimonial(user = Depends(auth_user)):
    """Delete own testimonial (only if pending)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        testimonial = await testimonials_collection.find_one({"userId": user["_id"]})
        
        if not testimonial:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy lời chứng thực"
            )
        
        # Only allow delete if status = pending
        if testimonial["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete approved review. Contact admin."
            )
        
        await testimonials_collection.delete_one({"userId": user["_id"]})
        
        return {"success": True, "message": "Xóa đánh giá thành công"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting testimonial: {str(e)}"
        )


# ============================================
# PUBLIC ROUTES
# ============================================

@router.get("/list")
async def get_approved_testimonials():
    """Get all approved testimonials (public route)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        testimonials = await testimonials_collection.find({
            "status": "approved"
        }).sort("createdAt", -1).to_list(100)
        
        # Convert ObjectId to string
        for t in testimonials:
            t["_id"] = str(t["_id"])
            t["userId"] = str(t["userId"])
        
        return {"success": True, "testimonials": testimonials}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching testimonials: {str(e)}"
        )


# ============================================
# ADMIN ROUTES
# ============================================

@router.get("/pending")
async def get_pending_testimonials(admin = Depends(auth_staff)):
    """Get all pending testimonials (admin only)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        testimonials = await testimonials_collection.find({
            "status": "pending"
        }).sort("createdAt", -1).to_list(100)
        
        # Convert ObjectId to string
        for t in testimonials:
            t["_id"] = str(t["_id"])
            t["userId"] = str(t["userId"])
        
        return {"success": True, "testimonials": testimonials}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending testimonials: {str(e)}"
        )


@router.put("/approve/{testimonial_id}")
async def approve_testimonial(
    testimonial_id: str,
    admin = Depends(auth_staff)
):
    """Approve testimonial (admin only)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        result = await testimonials_collection.update_one(
            {"_id": ObjectId(testimonial_id)},
            {"$set": {"status": "approved", "updatedAt": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy lời chứng thực"
            )
        
        return {"success": True, "message": "Testimonial approved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving testimonial: {str(e)}"
        )


@router.put("/reject/{testimonial_id}")
async def reject_testimonial(
    testimonial_id: str,
    admin = Depends(auth_staff)
):
    """Reject testimonial (admin only)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        result = await testimonials_collection.update_one(
            {"_id": ObjectId(testimonial_id)},
            {"$set": {"status": "rejected", "updatedAt": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy lời chứng thực"
            )
        
        return {"success": True, "message": "Testimonial rejected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting testimonial: {str(e)}"
        )


@router.delete("/admin/delete/{testimonial_id}")
async def admin_delete_testimonial(
    testimonial_id: str,
    admin = Depends(auth_staff)
):
    """Delete any testimonial (admin only)"""
    try:
        testimonials_collection = await get_collection("testimonials")
        
        result = await testimonials_collection.delete_one(
            {"_id": ObjectId(testimonial_id)}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy lời chứng thực"
            )
        
        return {"success": True, "message": "Xóa lời chứng thực thành công"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting testimonial: {str(e)}"
        )
