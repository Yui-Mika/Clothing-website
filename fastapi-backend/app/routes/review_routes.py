from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewStats
from app.config.database import get_collection
from app.middleware.auth_admin import auth_user
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# ===== ENDPOINT 1: CREATE REVIEW (Verified Purchase Only) =====
@router.post("/create", response_model=dict)
async def create_review(
    review_data: ReviewCreate,
    current_user: dict = Depends(auth_user)
):
    """
    Create a new review for a product.
    Only users who have purchased and received the product can review (verified purchase).
    """
    try:
        reviews_collection = await get_collection("reviews")
        orders_collection = await get_collection("orders")
        users_collection = await get_collection("users")
        products_collection = await get_collection("products")

        # 1. Validate product exists
        product = await products_collection.find_one({"_id": ObjectId(review_data.productId)})
        if not product:
            raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

        # 2. Check if user already reviewed this product
        existing_review = await reviews_collection.find_one({
            "productId": ObjectId(review_data.productId),
            "userId": ObjectId(current_user["_id"])
        })
        
        if existing_review:
            raise HTTPException(
                status_code=400,
                detail="Bạn đã đánh giá sản phẩm này rồi. Vui lòng chỉnh sửa đánh giá hiện tại."
            )

        # 3. CHECK VERIFIED PURCHASE (Option 1 - Strict)
        # Find order where user bought this product and it's delivered
        order = await orders_collection.find_one({
            "userId": str(current_user["_id"]),
            "status": "Delivered",
            "items": {
                "$elemMatch": {
                    "product._id": review_data.productId
                }
            }
        })

        if not order:
            raise HTTPException(
                status_code=403,
                detail="Bạn phải mua và nhận sản phẩm này trước khi viết đánh giá"
            )

        # Get purchase date from order
        purchase_date = order.get("updatedAt") or order.get("createdAt")

        # 4. Get user info
        user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
        user_name = user.get("name", "Anonymous")
        user_avatar = f"https://ui-avatars.com/api/?name={user_name.replace(' ', '+')}&background=3B82F6&color=fff"

        # 5. Create review with verified = True (because we checked order)
        new_review = {
            "productId": ObjectId(review_data.productId),
            "userId": ObjectId(current_user["_id"]),
            "rating": review_data.rating,
            "title": review_data.title,
            "comment": review_data.comment,
            "userName": user_name,
            "userAvatar": user_avatar,
            "verified": True,  # Always True in Option 1 (Strict)
            "purchaseDate": purchase_date,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        result = await reviews_collection.insert_one(new_review)

        return {
            "success": True,
            "message": "Tạo đánh giá thành công",
            "reviewId": str(result.inserted_id)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create review: {str(e)}")


# ===== ENDPOINT 2: GET REVIEWS FOR A PRODUCT =====
@router.get("/product/{product_id}", response_model=dict)
async def get_product_reviews(
    product_id: str,
    sort_by: Optional[str] = Query("newest", enum=["newest", "oldest", "rating_desc", "rating_asc"]),
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0)
):
    """Get all reviews for a specific product with sorting options"""
    try:
        reviews_collection = await get_collection("reviews")

        # Validate product_id
        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")

        # Build sort query
        sort_query = {}
        if sort_by == "newest":
            sort_query = {"createdAt": -1}
        elif sort_by == "oldest":
            sort_query = {"createdAt": 1}
        elif sort_by == "rating_desc":
            sort_query = {"rating": -1, "createdAt": -1}
        elif sort_by == "rating_asc":
            sort_query = {"rating": 1, "createdAt": -1}

        # Get reviews
        reviews_cursor = reviews_collection.find(
            {"productId": ObjectId(product_id)}
        ).sort(list(sort_query.items())).skip(skip).limit(limit)

        reviews = await reviews_cursor.to_list(length=limit)

        # Convert ObjectId to string
        for review in reviews:
            review["_id"] = str(review["_id"])
            review["productId"] = str(review["productId"])
            review["userId"] = str(review["userId"])

        # Get total count
        total_reviews = await reviews_collection.count_documents({"productId": ObjectId(product_id)})

        return {
            "success": True,
            "reviews": reviews,
            "total": total_reviews,
            "limit": limit,
            "skip": skip
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


# ===== ENDPOINT 3: GET REVIEW STATISTICS =====
@router.get("/product/{product_id}/stats", response_model=dict)
async def get_review_stats(product_id: str):
    """Get review statistics for a product (average rating, total reviews, rating distribution)"""
    try:
        reviews_collection = await get_collection("reviews")

        if not ObjectId.is_valid(product_id):
            raise HTTPException(status_code=400, detail="ID sản phẩm không hợp lệ")

        # Aggregate statistics
        pipeline = [
            {"$match": {"productId": ObjectId(product_id)}},
            {
                "$group": {
                    "_id": None,
                    "averageRating": {"$avg": "$rating"},
                    "totalReviews": {"$sum": 1},
                    "ratings": {"$push": "$rating"}
                }
            }
        ]

        result = await reviews_collection.aggregate(pipeline).to_list(length=1)

        if not result:
            return {
                "success": True,
                "averageRating": 0,
                "totalReviews": 0,
                "ratingDistribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            }

        stats = result[0]
        
        # Calculate rating distribution
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in stats.get("ratings", []):
            rating_distribution[rating] += 1

        return {
            "success": True,
            "averageRating": round(stats["averageRating"], 1),
            "totalReviews": stats["totalReviews"],
            "ratingDistribution": rating_distribution
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch review stats: {str(e)}")


# ===== ENDPOINT 4: UPDATE REVIEW (User's own review only) =====
@router.put("/{review_id}", response_model=dict)
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    current_user: dict = Depends(auth_user)
):
    """Update a review (user can only update their own review)"""
    try:
        reviews_collection = await get_collection("reviews")

        if not ObjectId.is_valid(review_id):
            raise HTTPException(status_code=400, detail="ID đánh giá không hợp lệ")

        # Find the review
        review = await reviews_collection.find_one({"_id": ObjectId(review_id)})
        if not review:
            raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")

        # Check if user owns this review
        if str(review["userId"]) != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Bạn chỉ có thể cập nhật đánh giá của mình")

        # Build update data (only update provided fields)
        update_data = {"updatedAt": datetime.utcnow()}
        if review_data.rating is not None:
            update_data["rating"] = review_data.rating
        if review_data.title is not None:
            update_data["title"] = review_data.title.strip()
        if review_data.comment is not None:
            update_data["comment"] = review_data.comment.strip()

        # Update review
        await reviews_collection.update_one(
            {"_id": ObjectId(review_id)},
            {"$set": update_data}
        )

        return {
            "success": True,
            "message": "Cập nhật đánh giá thành công"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update review: {str(e)}")


# ===== ENDPOINT 5: DELETE REVIEW =====
@router.delete("/{review_id}", response_model=dict)
async def delete_review(
    review_id: str,
    current_user: dict = Depends(auth_user)
):
    """Delete a review (user can delete their own review, admin can delete any)"""
    try:
        reviews_collection = await get_collection("reviews")

        if not ObjectId.is_valid(review_id):
            raise HTTPException(status_code=400, detail="ID đánh giá không hợp lệ")

        # Find the review
        review = await reviews_collection.find_one({"_id": ObjectId(review_id)})
        if not review:
            raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")

        # Check permission (user owns review OR user is admin)
        is_admin = current_user.get("role") in ["admin", "staff"]
        is_owner = str(review["userId"]) == str(current_user["_id"])

        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="Bạn không có quyền xóa đánh giá này")

        # Delete review
        await reviews_collection.delete_one({"_id": ObjectId(review_id)})

        return {
            "success": True,
            "message": "Xóa đánh giá thành công"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {str(e)}")


# ===== ENDPOINT 6: GET USER'S REVIEWS =====
@router.get("/user/my-reviews", response_model=dict)
async def get_user_reviews(
    current_user: dict = Depends(auth_user),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """Get all reviews written by the current user"""
    try:
        reviews_collection = await get_collection("reviews")
        products_collection = await get_collection("products")

        # Get user's reviews
        reviews_cursor = reviews_collection.find(
            {"userId": ObjectId(current_user["_id"])}
        ).sort("createdAt", -1).skip(skip).limit(limit)

        reviews = await reviews_cursor.to_list(length=limit)

        # Populate product info
        for review in reviews:
            product = await products_collection.find_one({"_id": review["productId"]})
            review["_id"] = str(review["_id"])
            review["productId"] = str(review["productId"])
            review["userId"] = str(review["userId"])
            review["productName"] = product.get("name") if product else "Product not found"
            review["productImage"] = product.get("image", [])[0] if product and product.get("image") else ""

        total_reviews = await reviews_collection.count_documents({"userId": ObjectId(current_user["_id"])})

        return {
            "success": True,
            "reviews": reviews,
            "total": total_reviews
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user reviews: {str(e)}")
