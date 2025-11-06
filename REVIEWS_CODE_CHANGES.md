# 📦 Code Changes Summary - Reviews Feature (Option 1)

## 🔧 Backend Changes

### 1. New Files Created

#### `app/models/review.py`
```python
# Pydantic models for reviews
- ReviewCreate: Validation cho create (productId, rating, title, comment)
- ReviewUpdate: Validation cho update (optional fields)
- Review: Full model với verified, purchaseDate
- ReviewStats: Model cho statistics
```

#### `app/routes/review_routes.py`
```python
# 6 API endpoints:
POST   /api/review/create                    # Tạo review (verified purchase only)
GET    /api/review/product/{product_id}      # Lấy reviews của sản phẩm
GET    /api/review/product/{product_id}/stats # Lấy thống kê
PUT    /api/review/{review_id}               # Sửa review
DELETE /api/review/{review_id}               # Xóa review
GET    /api/review/user/my-reviews           # Lấy reviews của user
```

#### `import_reviews.py`
```python
# Script import reviews.json vào MongoDB
# Tạo indexes cho performance
# Run: python import_reviews.py
```

### 2. Files Updated

#### `main.py`
```python
# Line 7: Add import
from app.routes import ..., review_routes  # <-- Added

# Line 52: Add router
app.include_router(review_routes.router, prefix="/api/review", tags=["Reviews"])  # <-- Added
```

#### `app/middleware/auth_admin.py`
```python
# Add new function at top (before auth_admin)
async def auth_user(request: Request):
    """Middleware to authenticate regular user from token cookie"""
    token = request.cookies.get("user_token")
    if not token:
        raise HTTPException(401, "User authentication required")
    # ... verify token and return user
```

---

## 🎨 Frontend Changes

### 1. New Files Created

#### `client/src/components/WriteReviewModal.jsx`
```jsx
// Modal component để viết review
Features:
- Star rating selector (1-5 stars)
- Title input (5-100 chars)
- Comment textarea (20-1000 chars)
- Form validation
- Submit to API
- Toast notifications

Props:
- isOpen: boolean
- onClose: function
- productId: string
- productName: string
- onReviewSubmitted: function (callback sau khi submit)
```

### 2. Files Updated

#### `client/src/components/ProductDescription.jsx`

**Imports Added:**
```jsx
import { useState, useEffect } from "react";  // Added useEffect
import { FiStar, FiCheck } from "react-icons/fi";  // Added FiStar, FiCheck
import axios from "axios";  // Added
import WriteReviewModal from "./WriteReviewModal";  // Added
```

**State Added:**
```jsx
const [reviews, setReviews] = useState([]);
const [reviewStats, setReviewStats] = useState(null);
const [isLoadingReviews, setIsLoadingReviews] = useState(false);
const [sortBy, setSortBy] = useState("newest");
const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
```

**Functions Added:**
```jsx
// Fetch reviews khi Reviews tab active
useEffect(() => {
  if (activeTab === "reviews" && product._id) {
    fetchReviews();
    fetchReviewStats();
  }
}, [activeTab, product._id, sortBy]);

const fetchReviews = async () => { /* ... */ }
const fetchReviewStats = async () => { /* ... */ }
const formatDate = (dateString) => { /* ... */ }
```

**Reviews Tab Updated:**
```jsx
// Completely rewritten to show:
1. Review Statistics Box (average rating, distribution chart)
2. Sort dropdown + Write Review button
3. Reviews list with:
   - User avatar
   - User name + Verified badge
   - Star rating
   - Date
   - Title + Comment
   - Purchase date
4. Loading state
5. Empty state
6. WriteReviewModal component
```

---

## 🗄️ Database

### `mongodb_collections/reviews.json`
```json
// 10 sample reviews
[
  {
    "_id": ObjectId,
    "productId": ObjectId,           // Links to products
    "userId": ObjectId,              // Links to users
    "rating": 1-5,
    "title": "string",
    "comment": "string",
    "userName": "string",
    "userAvatar": "string (UI Avatars URL)",
    "verified": true,                // Always true in Option 1
    "purchaseDate": Date,            // From order
    "createdAt": Date,
    "updatedAt": Date
  }
]
```

**Indexes Created:**
- productId (for fetching product reviews)
- userId (for fetching user reviews)
- createdAt (for sorting by date)
- rating (for sorting by rating)
- verified (for filtering verified)

---

## 🔄 API Flow

### Create Review Flow:
```
1. User clicks "Write a Review"
2. Modal opens (WriteReviewModal.jsx)
3. User fills rating, title, comment
4. Submit → POST /api/review/create
5. Backend checks:
   ✓ User logged in?
   ✓ Product exists?
   ✓ Already reviewed?
   ✓ Has delivered order with this product? ⭐ (Option 1 - Strict)
6. If all pass → Create review with verified=true
7. Frontend: Close modal, refresh reviews, show toast
```

### View Reviews Flow:
```
1. User opens product page, clicks "Reviews" tab
2. useEffect triggers:
   - fetchReviews()
   - fetchReviewStats()
3. GET /api/review/product/{id}?sort_by=newest&limit=10
4. GET /api/review/product/{id}/stats
5. Display:
   - Stats box (average, distribution)
   - Sort dropdown
   - Reviews list
```

---

## 🎯 Key Implementation Details

### Backend: Verified Purchase Check
```python
# In review_routes.py → create_review()
order = await orders_collection.find_one({
    "userId": str(current_user["_id"]),
    "status": "Delivered",  # Must be delivered
    "items": {
        "$elemMatch": {
            "product._id": review_data.productId
        }
    }
})

if not order:
    raise HTTPException(403, "Must purchase and receive product")
```

### Frontend: Review Statistics Display
```jsx
// Rating distribution bars
{[5, 4, 3, 2, 1].map((star) => {
  const count = reviewStats.ratingDistribution[star] || 0;
  const percentage = (count / reviewStats.totalReviews) * 100;
  return (
    <div className="flex items-center gap-3">
      <span>{star} ⭐</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-yellow-400 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span>{count}</span>
    </div>
  );
})}
```

---

## 📊 Files Tree

```
fastapi-backend/
├── app/
│   ├── models/
│   │   └── review.py                    ✅ NEW
│   ├── routes/
│   │   └── review_routes.py             ✅ NEW
│   └── middleware/
│       └── auth_admin.py                📝 UPDATED (added auth_user)
├── mongodb_collections/
│   └── reviews.json                     ✅ NEW
├── main.py                              📝 UPDATED (added review router)
└── import_reviews.py                    ✅ NEW

client/src/
└── components/
    ├── WriteReviewModal.jsx             ✅ NEW
    └── ProductDescription.jsx           📝 UPDATED (Reviews tab)
```

---

## ✅ Quick Start Commands

```powershell
# 1. Import reviews to database
cd fastapi-backend
python import_reviews.py

# 2. Start backend
uvicorn main:app --reload

# 3. Start frontend (new terminal)
cd client
npm run dev

# 4. Test
# - Go to product page → Reviews tab
# - Login as user who has delivered order
# - Try to write review
```

---

## 🎨 UI Components Hierarchy

```
ProductDescription.jsx
├── Tabs (Details, Care Guide, Reviews)
└── Reviews Tab
    ├── Review Stats Box
    │   ├── Average Rating Display
    │   └── Rating Distribution Bars
    ├── Controls Row
    │   ├── Sort Dropdown
    │   └── Write Review Button
    ├── Reviews List
    │   └── Review Card (per review)
    │       ├── User Avatar
    │       ├── User Name + Verified Badge
    │       ├── Star Rating + Date
    │       ├── Title
    │       ├── Comment
    │       └── Purchase Date
    └── WriteReviewModal (popup)
        ├── Star Rating Selector
        ├── Title Input
        ├── Comment Textarea
        └── Submit/Cancel Buttons
```

---

**That's all! Ready to test! 🚀**
