# API Documentation - Veloura E-commerce Backend

## Base URL
```
http://localhost:8000
```

## Authentication

API sử dụng JWT tokens được lưu trong HTTP-only cookies:
- **Customer**: Cookie name `token`
- **Admin/Staff**: Cookie name `admin_token`

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

## API Endpoints

---

## 🔐 User Authentication

### Register Customer
```http
POST /api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

### Login Customer
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Logout Customer
```http
POST /api/user/logout
```

### Check Authentication
```http
GET /api/user/is-auth
Cookie: token=<jwt_token>
```

### Get Profile
```http
GET /api/user/profile
Cookie: token=<jwt_token>
```

---

## 👨‍💼 Admin/Staff Authentication

### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@veloura.com",
  "password": "admin123"
}
```

### Check Admin Auth
```http
GET /api/admin/is-auth
Cookie: admin_token=<jwt_token>
```

---

## 🛍️ Products

### Get All Products
```http
GET /api/product/list?category=Men&popular=true&search=shirt
```

**Query Parameters:**
- `category` (optional): Filter by category
- `popular` (optional): Filter popular products
- `search` (optional): Search in name and description

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "673b1234567890abcdef1001",
      "name": "Classic Striped Shirt",
      "description": "...",
      "image": ["url1", "url2"],
      "price": 95.00,
      "offerPrice": 45.00,
      "category": "Men",
      "sizes": ["M", "L", "XL"],
      "popular": true,
      "isActive": true,
      "createdAt": "2024-10-01T10:00:00.000Z",
      "updatedAt": "2024-10-15T10:00:00.000Z"
    }
  ]
}
```

### Get Single Product
```http
GET /api/product/{product_id}
```

### Add Product (Staff/Admin)
```http
POST /api/product/add
Cookie: admin_token=<jwt_token>
Content-Type: multipart/form-data

productData: {
  "name": "New Product",
  "description": "Product description",
  "price": 100,
  "offerPrice": 80,
  "category": "Men",
  "sizes": ["M", "L"],
  "popular": false
}
images: [file1, file2]
```

### Update Product (Staff/Admin)
```http
PUT /api/product/{product_id}
Cookie: admin_token=<jwt_token>
Content-Type: multipart/form-data

productData: {
  "name": "Updated Name",
  "offerPrice": 70
}
images: [new_file] (optional)
```

### Delete Product (Staff/Admin)
```http
DELETE /api/product/{product_id}
Cookie: admin_token=<jwt_token>
```

---

## 📁 Categories

### Get All Categories
```http
GET /api/category/list
```

### Add Category (Staff/Admin)
```http
POST /api/category/add
Cookie: admin_token=<jwt_token>
Content-Type: multipart/form-data

name: "New Category"
description: "Category description"
image: file (optional)
```

### Update Category (Staff/Admin)
```http
PUT /api/category/{category_id}
Cookie: admin_token=<jwt_token>
Content-Type: multipart/form-data

name: "Updated Name"
description: "Updated description"
image: new_file (optional)
```

### Delete Category (Staff/Admin)
```http
DELETE /api/category/{category_id}
Cookie: admin_token=<jwt_token>
```

---

## 🛒 Cart

### Add to Cart
```http
POST /api/cart/add
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "itemId": "673b1234567890abcdef1001",
  "size": "M"
}
```

### Update Cart
```http
POST /api/cart/update
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "itemId": "673b1234567890abcdef1001",
  "size": "M",
  "quantity": 3
}
```

Note: Set quantity to 0 to remove item

### Get Cart
```http
GET /api/cart/get
Cookie: token=<jwt_token>
```

**Response:**
```json
{
  "success": true,
  "cartData": {
    "673b1234567890abcdef1001": {
      "M": 2,
      "L": 1
    }
  }
}
```

### Clear Cart
```http
DELETE /api/cart/clear
Cookie: token=<jwt_token>
```

---

## 📦 Orders

### Place Order - COD
```http
POST /api/order/cod
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "items": [
    {
      "product": "673b1234567890abcdef1001",
      "quantity": 2,
      "size": "M"
    }
  ],
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipcode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  }
}
```

### Place Order - Stripe
```http
POST /api/order/stripe
Cookie: token=<jwt_token>
Content-Type: application/json

{
  "items": [...],
  "address": {...}
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### Get User Orders
```http
POST /api/order/userorders
Cookie: token=<jwt_token>
```

### Get All Orders (Staff/Admin)
```http
POST /api/order/list
Cookie: admin_token=<jwt_token>
```

### Update Order Status (Staff/Admin)
```http
POST /api/order/status
Cookie: admin_token=<jwt_token>
Content-Type: application/json

{
  "orderId": "673b1234567890abcdef2001",
  "status": "Shipped"
}
```

**Valid Statuses:**
- Order Placed
- Processing
- Shipped
- Delivered
- Cancelled

---

## 📝 Blogs

### Get All Blogs
```http
GET /api/blog/list?published_only=true
```

### Get Single Blog
```http
GET /api/blog/{blog_id}
```

### Add Blog (Staff/Admin)
```http
POST /api/blog/add
Cookie: admin_token=<jwt_token>
Content-Type: multipart/form-data

title: "Blog Title"
category: "Fashion Trends"
content: "Blog content here..."
author: "Author Name"
image: file (optional)
```

### Update Blog (Staff/Admin)
```http
PUT /api/blog/{blog_id}
Cookie: admin_token=<jwt_token>
Content-Type: multipart/form-data

title: "Updated Title"
content: "Updated content"
```

### Delete Blog (Staff/Admin)
```http
DELETE /api/blog/{blog_id}
Cookie: admin_token=<jwt_token>
```

---

## ⭐ Testimonials

### Get All Testimonials
```http
GET /api/testimonial/list?approved_only=true
```

### Add Testimonial
```http
POST /api/testimonial/add
Content-Type: multipart/form-data

name: "Customer Name"
role: "Customer"
rating: 5
comment: "Great products!"
image: file (optional)
```

### Approve Testimonial (Staff/Admin)
```http
PUT /api/testimonial/{testimonial_id}/approve
Cookie: admin_token=<jwt_token>
```

### Delete Testimonial (Staff/Admin)
```http
DELETE /api/testimonial/{testimonial_id}
Cookie: admin_token=<jwt_token>
```

---

## 📧 Contact

### Submit Contact Form
```http
POST /api/contact/submit
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Product Inquiry",
  "message": "I have a question about..."
}
```

### Get All Contacts (Staff/Admin)
```http
GET /api/contact/list
Cookie: admin_token=<jwt_token>
```

### Get Unread Count (Staff/Admin)
```http
GET /api/contact/unread-count
Cookie: admin_token=<jwt_token>
```

### Get Single Contact (Staff/Admin)
```http
GET /api/contact/{contact_id}
Cookie: admin_token=<jwt_token>
```

### Update Contact Status (Staff/Admin)
```http
PUT /api/contact/{contact_id}/status?status=resolved
Cookie: admin_token=<jwt_token>
```

**Valid Statuses:**
- pending
- in-progress
- resolved

---

## 👥 Customer Management (Admin Only)

### Get All Customers
```http
GET /api/admin/customers
Cookie: admin_token=<jwt_token>
```

### Get Single Customer
```http
GET /api/admin/customers/{customer_id}
Cookie: admin_token=<jwt_token>
```

### Toggle Customer Status
```http
PUT /api/admin/customers/{customer_id}/toggle-status
Cookie: admin_token=<jwt_token>
```

### Delete Customer
```http
DELETE /api/admin/customers/{customer_id}
Cookie: admin_token=<jwt_token>
```

---

## 📊 Reports (Admin Only)

### Dashboard Statistics
```http
GET /api/report/dashboard
Cookie: admin_token=<jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalCustomers": 150,
    "totalProducts": 75,
    "totalOrders": 320,
    "totalRevenue": 45678.50,
    "recentOrders": 45,
    "orderStatuses": {
      "Order Placed": 20,
      "Shipped": 15,
      "Delivered": 285
    }
  }
}
```

### Sales Report
```http
GET /api/report/sales?start_date=2024-10-01&end_date=2024-10-31
Cookie: admin_token=<jwt_token>
```

### Product Report
```http
GET /api/report/products
Cookie: admin_token=<jwt_token>
```

### Customer Report
```http
GET /api/report/customers
Cookie: admin_token=<jwt_token>
```

### Revenue Report
```http
GET /api/report/revenue?period=monthly
Cookie: admin_token=<jwt_token>
```

**Period options:**
- daily
- weekly
- monthly
- yearly

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

No rate limiting currently implemented. Consider adding for production.

## Webhooks

### Stripe Webhook (Optional)
```http
POST /api/order/webhook/stripe
Content-Type: application/json

[Stripe webhook payload]
```

---

## Testing with cURL

### Example: Get Products
```bash
curl http://localhost:8000/api/product/list
```

### Example: Login and Get Profile
```bash
# Login
curl -X POST http://localhost:8000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  -c cookies.txt

# Use saved cookie to get profile
curl http://localhost:8000/api/user/profile \
  -b cookies.txt
```

---

## Postman Collection

Import the API into Postman:
1. Open Postman
2. Import → Link
3. Enter: `http://localhost:8000/openapi.json`

Or use the interactive Swagger UI at: http://localhost:8000/docs
