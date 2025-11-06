# 📝 Reviews Feature Implementation Guide (Option 1 - Strict)

## ✅ Files Created/Updated

### 🗄️ Database
1. **`fastapi-backend/mongodb_collections/reviews.json`** ✅
   - 10 sample reviews with verified purchases
   - Linked to existing products and users from orders

### 🔧 Backend Files

#### Models
2. **`fastapi-backend/app/models/review.py`** ✅ (NEW)
   - `ReviewCreate`: Validation for creating reviews
   - `ReviewUpdate`: Validation for updating reviews
   - `Review`: Full review model with all fields
   - `ReviewResponse`: API response model
   - `ReviewStats`: Statistics model (average rating, distribution)

#### Routes
3. **`fastapi-backend/app/routes/review_routes.py`** ✅ (NEW)
   - `POST /api/review/create` - Create review (verified purchase only)
   - `GET /api/review/product/{product_id}` - Get product reviews
   - `GET /api/review/product/{product_id}/stats` - Get review statistics
   - `PUT /api/review/{review_id}` - Update own review
   - `DELETE /api/review/{review_id}` - Delete review (owner/admin)
   - `GET /api/review/user/my-reviews` - Get user's all reviews

#### Middleware
4. **`fastapi-backend/app/middleware/auth_admin.py`** ✅ (UPDATED)
   - Added `auth_user()` function for regular user authentication
   - Existing `auth_admin()` and `auth_staff()` remain unchanged

#### Main App
5. **`fastapi-backend/main.py`** ✅ (UPDATED)
   - Added import: `review_routes`
   - Added router: `app.include_router(review_routes.router, prefix="/api/review", tags=["Reviews"])`

#### Scripts
6. **`fastapi-backend/import_reviews.py`** ✅ (NEW)
   - Script to import reviews.json to MongoDB
   - Creates indexes for better performance
   - Converts dates and ObjectIds properly

### 🎨 Frontend Files

#### Components
7. **`client/src/components/WriteReviewModal.jsx`** ✅ (NEW)
   - Modal dialog for writing reviews
   - Star rating selector with hover effects
   - Title input (5-100 chars)
   - Comment textarea (20-1000 chars)
   - Form validation and submission
   - Toast notifications for success/error

8. **`client/src/components/ProductDescription.jsx`** ✅ (UPDATED)
   - Added Reviews tab functionality
   - Fetches reviews from API
   - Displays review statistics (average rating, distribution)
   - Shows individual reviews with:
     - User avatar and name
     - "Verified Purchase" badge
     - Star rating
     - Review title and comment
     - Purchase date
   - Sort options (newest, oldest, highest/lowest rating)
   - "Write a Review" button opens modal
   - Loading states and empty states

---

## 📋 Setup Instructions

### Step 1: Import Reviews to Database
```powershell
# Navigate to backend folder
cd fastapi-backend

# Run import script
python import_reviews.py
```

**Expected Output:**
```
============================================================
IMPORTING REVIEWS TO MONGODB
============================================================
Connected to MongoDB database: Shop
Found 10 reviews in mongodb_collections/reviews.json
Dropped existing reviews collection

✅ Successfully imported 10 reviews!
✅ Created indexes on reviews collection

📊 Sample reviews:
1. Perfect fit and great quality!
   Rating: ⭐⭐⭐⭐⭐ (5/5)
   By: John Anderson ✓ Verified Purchase
   Product ID: 673b1234567890abcdef1002
...
```

### Step 2: Start Backend Server
```powershell
# Make sure you're in fastapi-backend folder
cd fastapi-backend

# Start server
uvicorn main:app --reload
```

**Check API Docs:**
- Open browser: `http://localhost:8000/docs`
- You should see new **Reviews** section with 6 endpoints

### Step 3: Start Frontend
```powershell
# Navigate to client folder
cd client

# Start dev server
npm run dev
```

### Step 4: Test the Feature
1. **View Reviews:**
   - Go to any product detail page
   - Click "Reviews" tab
   - You should see reviews with stats

2. **Write a Review:**
   - Click "Write a Review" button
   - ⚠️ **IMPORTANT**: You must be logged in AND have purchased the product
   - Fill in rating, title, comment
   - Submit

3. **Error Cases to Test:**
   - Try to review without login → Should show "Please login"
   - Try to review product you haven't bought → Should show "You must purchase this product"
   - Try to review same product twice → Should show "You already reviewed"

---

## 🔐 Business Rules (Option 1 - Strict)

### ✅ Who Can Review?
- **ONLY users who purchased AND received the product**
- Order status must be "Delivered"
- User must be logged in

### 📝 Review Requirements:
- ⭐ Rating: 1-5 stars (required)
- 📌 Title: 5-100 characters (required)
- 💬 Comment: 20-1000 characters (required)

### 🔄 Review Limits:
- **1 review per user per product**
- Can edit/delete own review anytime
- Admin can delete any review

### 🏷️ Verified Badge:
- **Always shows "Verified Purchase"** in Option 1
- Shows purchase date from order

---

## 🎯 API Endpoints Reference

### 1. Create Review
```
POST /api/review/create
Headers: Cookie: user_token=...
Body: {
  "productId": "673b1234567890abcdef1001",
  "rating": 5,
  "title": "Amazing product!",
  "comment": "This is the best product I've ever bought. Highly recommend to everyone!"
}
```

### 2. Get Product Reviews
```
GET /api/review/product/{product_id}?sort_by=newest&limit=10&skip=0
```

### 3. Get Review Stats
```
GET /api/review/product/{product_id}/stats
Response: {
  "averageRating": 4.5,
  "totalReviews": 10,
  "ratingDistribution": {1: 0, 2: 0, 3: 1, 4: 3, 5: 6}
}
```

### 4. Update Review
```
PUT /api/review/{review_id}
Headers: Cookie: user_token=...
Body: {
  "rating": 4,
  "title": "Updated title",
  "comment": "Updated comment with more details..."
}
```

### 5. Delete Review
```
DELETE /api/review/{review_id}
Headers: Cookie: user_token=...
```

### 6. Get My Reviews
```
GET /api/review/user/my-reviews?limit=20&skip=0
Headers: Cookie: user_token=...
```

---

## 🗂️ Database Indexes Created

```javascript
// For better query performance
reviews.createIndex({ "productId": 1 })      // Find by product
reviews.createIndex({ "userId": 1 })          // Find by user
reviews.createIndex({ "createdAt": -1 })     // Sort by date
reviews.createIndex({ "rating": -1 })         // Sort by rating
reviews.createIndex({ "verified": -1 })      // Filter verified
```

---

## 🎨 UI Features

### Review Statistics Box
- Large average rating display (e.g., "4.5/5")
- Star visualization
- Total review count
- Rating distribution bar chart (5⭐ to 1⭐)

### Individual Review Card
- User avatar (generated from name)
- User name
- ✅ "Verified Purchase" badge (green)
- Star rating
- Review date
- Review title (bold)
- Review comment
- Purchase date (small text)

### Sort Options
- Newest First (default)
- Oldest First
- Highest Rating
- Lowest Rating

### Empty State
- Large star icon
- "No Reviews Yet" message
- "Be the first to share..." text
- "Write a Review" button

---

## 🐛 Common Issues & Solutions

### Issue 1: Can't write review
**Solution:** 
- Make sure you're logged in
- Make sure you have an order with status "Delivered" containing this product
- Check browser cookies for `user_token`

### Issue 2: Reviews not loading
**Solution:**
- Check backend is running on port 8000
- Check `VITE_BACKEND_URL` in `.env` file
- Open browser console for errors
- Test API directly: `http://localhost:8000/api/review/product/{product_id}`

### Issue 3: "Already reviewed" error but you want to change review
**Solution:**
- Use the UPDATE endpoint instead of CREATE
- Or delete existing review first, then create new one

---

## 📊 Sample Reviews Data

The `reviews.json` file contains:
- 10 reviews
- For 5 different products
- From 10 different users
- All verified purchases (from delivered orders)
- Ratings: 3⭐ (1), 4⭐ (3), 5⭐ (6)
- Dates: October 2024

Products with reviews:
1. Washable Milano Ribbed Knitted T-Shirt (2 reviews)
2. Men's White Oxford Dress Shirt (2 reviews)
3. Men's Dark Blue Slim Fit Jeans (2 reviews)
4. Premium Leather Men's Wallet (2 reviews)
5. Men's Leather Belt with Auto Buckle (2 reviews)

---

## 🚀 Next Steps (Optional Enhancements)

1. **Pagination:** Load more reviews (currently limited to 10)
2. **Edit Review:** Add edit button on user's own reviews
3. **Admin Moderation:** Flag/hide inappropriate reviews
4. **Image Upload:** Allow users to upload product photos
5. **Helpful Votes:** "Was this review helpful?" buttons
6. **Review Response:** Allow seller to respond to reviews

---

## ✅ Checklist

- [x] Create reviews.json with sample data
- [x] Create Review model (review.py)
- [x] Create Review routes (review_routes.py)
- [x] Add auth_user middleware
- [x] Update main.py to include review routes
- [x] Create import script (import_reviews.py)
- [x] Create WriteReviewModal component
- [x] Update ProductDescription with Reviews tab
- [ ] Run import_reviews.py script
- [ ] Test create review (verified purchase check)
- [ ] Test view reviews with sorting
- [ ] Test review statistics display
- [ ] Test update/delete review

---

**Implementation Complete! 🎉**

Follow the setup instructions above to get the reviews feature running.
