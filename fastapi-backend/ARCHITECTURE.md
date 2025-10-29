# Kiến trúc hệ thống Veloura Backend (FastAPI)

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│              (http://localhost:5173)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS Requests
                       │ (JWT Cookies)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND                            │
│                  (http://localhost:8000)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Main Application (main.py)             │    │
│  │  - CORS Middleware                                  │    │
│  │  - Routers Registration                             │    │
│  │  - Lifespan Events                                  │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                       │
│  ┌───────────────────┴────────────────────────────────┐    │
│  │                   ROUTES LAYER                      │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │ User Routes  │  │ Admin Routes │                │    │
│  │  │ - Register   │  │ - Login      │                │    │
│  │  │ - Login      │  │ - Customers  │                │    │
│  │  │ - Profile    │  │ - Staff Mgmt │                │    │
│  │  └──────────────┘  └──────────────┘                │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │Product Routes│  │Category Rts  │                │    │
│  │  │ - List       │  │ - CRUD       │                │    │
│  │  │ - CRUD       │  └──────────────┘                │    │
│  │  │ - Upload     │                                   │    │
│  │  └──────────────┘  ┌──────────────┐                │    │
│  │                     │ Cart Routes  │                │    │
│  │  ┌──────────────┐  │ - Add        │                │    │
│  │  │ Order Routes │  │ - Update     │                │    │
│  │  │ - COD        │  │ - Get        │                │    │
│  │  │ - Stripe     │  └──────────────┘                │    │
│  │  │ - List       │                                   │    │
│  │  │ - Status     │  ┌──────────────┐                │    │
│  │  └──────────────┘  │ Blog Routes  │                │    │
│  │                     │ - CRUD       │                │    │
│  │  ┌──────────────┐  └──────────────┘                │    │
│  │  │Testimonials  │                                   │    │
│  │  │ - CRUD       │  ┌──────────────┐                │    │
│  │  │ - Approve    │  │Contact Rts   │                │    │
│  │  └──────────────┘  │ - Submit     │                │    │
│  │                     │ - List       │                │    │
│  │  ┌──────────────┐  └──────────────┘                │    │
│  │  │Report Routes │                                   │    │
│  │  │ - Dashboard  │                                   │    │
│  │  │ - Sales      │                                   │    │
│  │  │ - Products   │                                   │    │
│  │  │ - Customers  │                                   │    │
│  │  └──────────────┘                                   │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                       │
│  ┌───────────────────┴────────────────────────────────┐    │
│  │              MIDDLEWARE LAYER                       │    │
│  │                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐        │    │
│  │  │  auth_user.py    │  │  auth_admin.py   │        │    │
│  │  │  - Verify Token  │  │  - Verify Token  │        │    │
│  │  │  - Get User      │  │  - Check Role    │        │    │
│  │  │  - Check Active  │  │  - Get Admin     │        │    │
│  │  └──────────────────┘  └──────────────────┘        │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                       │
│  ┌───────────────────┴────────────────────────────────┐    │
│  │               MODELS LAYER (Pydantic)               │    │
│  │                                                      │    │
│  │  • user.py      - User, Auth models                 │    │
│  │  • product.py   - Product models                    │    │
│  │  • category.py  - Category models                   │    │
│  │  • cart.py      - Cart models                       │    │
│  │  • order.py     - Order models                      │    │
│  │  • blog.py      - Blog models                       │    │
│  │  • testimonial.py - Testimonial models              │    │
│  │  • contact.py   - Contact models                    │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                       │
│  ┌───────────────────┴────────────────────────────────┐    │
│  │               UTILS & CONFIG                        │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │   auth.py    │  │  settings.py │                │    │
│  │  │  - JWT       │  │  - Env Vars  │                │    │
│  │  │  - Password  │  └──────────────┘                │    │
│  │  │    Hashing   │                                   │    │
│  │  └──────────────┘  ┌──────────────┐                │    │
│  │                     │ database.py  │                │    │
│  │  ┌──────────────┐  │  - MongoDB   │                │    │
│  │  │cloudinary.py │  │  - Motor     │                │    │
│  │  │  - Upload    │  │  - Connect   │                │    │
│  │  │  - Delete    │  └──────────────┘                │    │
│  │  └──────────────┘                                   │    │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬─────────────────┬───────────────────────┘
                   │                 │
                   ↓                 ↓
         ┌─────────────────┐  ┌─────────────────┐
         │    MongoDB      │  │   Cloudinary    │
         │   (Database)    │  │  (Image Store)  │
         │                 │  │                 │
         │  Collections:   │  │   Folders:      │
         │  - users        │  │  - products     │
         │  - products     │  │  - categories   │
         │  - categories   │  │  - blogs        │
         │  - orders       │  │  - testimonials │
         │  - blogs        │  └─────────────────┘
         │  - testimonials │
         │  - contacts     │  ┌─────────────────┐
         └─────────────────┘  │     Stripe      │
                              │   (Payment)     │
                              │                 │
                              │  - Checkout     │
                              │  - Webhooks     │
                              └─────────────────┘
```

## Chi tiết các tầng

### 1. **Routes Layer** (API Endpoints)
Xử lý HTTP requests và responses.

**Phân quyền:**
- **Public**: Không cần auth (Products list, Blogs, etc.)
- **Customer**: Cần `token` cookie (Cart, Orders, Profile)
- **Staff**: Cần `admin_token` + role `staff` (Products, Orders, Blogs CRUD)
- **Admin**: Cần `admin_token` + role `admin` (All + Reports, Customer Management)

### 2. **Middleware Layer** (Authentication & Authorization)
Xác thực và phân quyền người dùng.

**Flow:**
1. Client gửi request với cookie
2. Middleware đọc token từ cookie
3. Verify JWT token
4. Lấy user từ database
5. Kiểm tra role và status
6. Inject user vào request.state
7. Continue hoặc raise 401/403

### 3. **Models Layer** (Data Validation)
Pydantic models cho validation và serialization.

**Types:**
- **Create models**: Dữ liệu từ client (input)
- **Response models**: Dữ liệu trả về client (output)
- **Update models**: Dữ liệu cập nhật (partial)
- **Base models**: Shared fields

### 4. **Utils & Config Layer**
Helper functions và cấu hình.

**Components:**
- **auth.py**: JWT creation/verification, password hashing
- **database.py**: MongoDB connection with Motor
- **cloudinary.py**: Image upload/delete
- **settings.py**: Environment variables

## Data Flow

### Example: Customer Places Order (COD)

```
1. CLIENT
   └─> POST /api/order/cod
       Cookie: token=<jwt>
       Body: { items, address }

2. MIDDLEWARE (auth_user)
   └─> Verify JWT token
   └─> Get user from MongoDB
   └─> Inject user to request.state

3. ROUTE (order_routes.py)
   └─> Validate OrderCreate model
   └─> For each item:
       ├─> Get product from MongoDB
       ├─> Calculate price
       └─> Build order items
   └─> Calculate total + delivery
   └─> Create order document
   └─> Insert to MongoDB orders collection
   └─> Clear user cart
   └─> Return success response

4. CLIENT
   └─> Receive order confirmation
   └─> Navigate to /my-orders
```

### Example: Admin Views Sales Report

```
1. CLIENT
   └─> GET /api/report/sales?start_date=...
       Cookie: admin_token=<jwt>

2. MIDDLEWARE (auth_admin_only)
   └─> Verify JWT token
   └─> Check role === "admin"
   └─> Get admin from MongoDB
   └─> Inject admin to request.state

3. ROUTE (report_routes.py)
   └─> Build MongoDB aggregation pipeline
   └─> Execute queries:
       ├─> Total sales
       ├─> Total orders
       └─> Daily breakdown
   └─> Format response
   └─> Return report data

4. CLIENT
   └─> Render charts/tables
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  cartData: {
    "productId": {
      "size": quantity
    }
  },
  role: String (customer|staff|admin),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String (text indexed),
  description: String (text indexed),
  image: [String], // Cloudinary URLs
  price: Number,
  offerPrice: Number,
  category: String (indexed),
  sizes: [String],
  popular: Boolean (indexed),
  isActive: Boolean (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  items: [{
    product: {
      _id, name, image, offerPrice
    },
    quantity: Number,
    size: String
  }],
  amount: Number,
  address: Object,
  status: String (indexed),
  paymentMethod: String (COD|Stripe),
  isPaid: Boolean,
  paidAt: Date,
  stripeSessionId: String,
  createdAt: Date (indexed desc),
  updatedAt: Date
}
```

## Security

### Authentication
- JWT tokens with HS256 algorithm
- Tokens stored in HTTP-only cookies
- Separate tokens for customers and admins
- 7-day expiration

### Password Security
- Bcrypt hashing with salt rounds
- Minimum 6 characters
- Validation in Pydantic models

### Authorization
- Role-based access control (RBAC)
- Middleware checks for each endpoint
- Three roles: customer, staff, admin

### CORS
- Configured for specific origins
- Credentials enabled
- All methods and headers allowed

## File Upload Flow

```
1. CLIENT
   └─> Upload images (multipart/form-data)

2. ROUTE
   └─> Receive UploadFile objects
   └─> Read file contents

3. CLOUDINARY
   └─> Upload to cloud storage
   └─> Receive secure URLs

4. MONGODB
   └─> Store URLs in document
   └─> Return to client
```

## Payment Flow (Stripe)

```
1. CLIENT
   └─> POST /api/order/stripe

2. ROUTE
   └─> Create pending order in DB
   └─> Create Stripe Checkout Session
   └─> Return session URL

3. CLIENT
   └─> Redirect to Stripe Checkout
   └─> Customer completes payment

4. STRIPE
   └─> Payment success
   └─> Redirect to success URL

5. CLIENT
   └─> GET /api/order/verify-stripe

6. ROUTE
   └─> Verify payment with Stripe
   └─> Update order status
   └─> Clear cart
   └─> Confirm order
```

## Scalability Considerations

### Current Architecture
- Suitable for small to medium applications
- Single server deployment
- Synchronous database operations with async/await

### Future Improvements
1. **Caching**: Redis for frequently accessed data
2. **Load Balancing**: Multiple FastAPI instances
3. **Database**: MongoDB replica sets
4. **CDN**: CloudFront for Cloudinary images
5. **Queue**: Celery for background tasks
6. **Monitoring**: Prometheus + Grafana
7. **Logging**: ELK stack

## Performance Optimizations

### Database
- Indexes on frequently queried fields
- Text search indexes
- Aggregation pipelines for reports
- Connection pooling with Motor

### API
- Async/await throughout
- Minimal data transfer
- Pagination for large lists
- Field projection in queries

### Caching
- Static assets with CDN
- API responses (future)
- Database query results (future)

## Error Handling

### HTTP Status Codes
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

### Error Response Format
```json
{
  "detail": "Error message"
}
```

## Testing Strategy

### Unit Tests
- Models validation
- Utils functions (auth, hashing)
- Individual route logic

### Integration Tests
- Full API endpoints
- Database operations
- Authentication flow

### End-to-End Tests
- Complete user journeys
- Payment processing
- Order fulfillment

## Deployment Architecture

```
                   ┌──────────────┐
                   │   Client     │
                   │  (Vercel)    │
                   └───────┬──────┘
                           │
                   ┌───────▼──────┐
                   │  CloudFlare  │
                   │     CDN      │
                   └───────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼─────────┐    ┌─────────▼────────┐
     │   FastAPI Server │    │   Cloudinary     │
     │   (Railway/      │    │   (Images)       │
     │    Render)       │    └──────────────────┘
     └────────┬─────────┘
              │
     ┌────────▼─────────┐
     │  MongoDB Atlas   │
     │   (Database)     │
     └──────────────────┘
```

## Monitoring & Logging

### Logs
- Request/Response logs
- Error logs with stack traces
- Database query logs
- Authentication attempts

### Metrics
- API response times
- Database query performance
- Error rates
- Active users

### Alerts
- Server down
- High error rate
- Database connection issues
- Payment failures
