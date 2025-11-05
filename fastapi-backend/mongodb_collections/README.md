# MongoDB Collections for Veloura E-commerce

This directory contains sample JSON data for MongoDB collections used in the Veloura e-commerce platform.

## Collections Overview

### 1. **users.json**
Contains user accounts including customers, staff, and admin.

**Roles:**
- `customer`: Regular users who can browse and purchase products
- `staff`: Can manage products, categories, orders, and blogs
- `admin`: Full access including customer management and reports

**Sample Credentials:**
- Admin: `admin@veloura.com` / `admin123`
- Staff: `staff@veloura.com` / `staff123`
- Customer: `john.doe@example.com` / `password123`

### 2. **products.json**
Product catalog with images, pricing, categories, and sizes.

**Categories:**
- Men
- Women
- Kids
- Footwear
- Winterwear
- Sportswear

### 3. **orders.json**
Customer orders with items, addresses, payment info, and status tracking.

**Order Statuses:**
- Order Placed
- Processing
- Shipped
- Delivered
- Cancelled

**Payment Methods:**
- COD (Cash on Delivery)
- Stripe (Online payment)

### 4. **categories.json**
Product categories with descriptions and images.

### 5. **blogs.json**
Blog posts with content, categories, and author information.

### 6. **testimonials.json**
Customer reviews and ratings (requires approval by staff/admin).

### 7. **contacts.json**
Contact form submissions from customers.

**Contact Statuses:**
- pending
- in-progress
- resolved

## Importing Data to MongoDB

### Using MongoDB Compass:
1. Open MongoDB Compass and connect to your database
2. Create a new database named `veloura_db`
3. For each collection:
   - Create a new collection
   - Click "ADD DATA" → "Import JSON or CSV file"
   - Select the corresponding JSON file
   - Click "Import"

### Using mongoimport (Command Line):
```bash
# Import users
mongoimport --db veloura_db --collection users --file users.json --jsonArray

# Import products
mongoimport --db veloura_db --collection products --file products.json --jsonArray

# Import orders
mongoimport --db veloura_db --collection orders --file orders.json --jsonArray

# Import categories
mongoimport --db veloura_db --collection categories --file categories.json --jsonArray

# Import blogs
mongoimport --db veloura_db --collection blogs --file blogs.json --jsonArray

# Import testimonials
mongoimport --db veloura_db --collection testimonials --file testimonials.json --jsonArray

# Import contacts
mongoimport --db veloura_db --collection contacts --file contacts.json --jsonArray
```

### Using Python Script:
```python
from pymongo import MongoClient
import json

client = MongoClient("your_mongodb_connection_string")
db = client["veloura_db"]

collections = ["users", "products", "orders", "categories", "blogs", "testimonials", "contacts"]

for collection_name in collections:
    with open(f"{collection_name}.json", "r") as file:
        data = json.load(file)
        db[collection_name].insert_many(data)
    print(f"✓ Imported {collection_name}")
```

## Database Indexes

For better performance, create the following indexes:

```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

// Products collection
db.products.createIndex({ "category": 1 })
db.products.createIndex({ "popular": 1 })
db.products.createIndex({ "isActive": 1 })
db.products.createIndex({ "name": "text", "description": "text" })

// Orders collection
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "createdAt": -1 })

// Blogs collection
db.blogs.createIndex({ "isPublished": 1 })
db.blogs.createIndex({ "createdAt": -1 })

// Contacts collection
db.contacts.createIndex({ "isRead": 1 })
db.contacts.createIndex({ "status": 1 })
```

## Notes

- All passwords in the sample data are hashed using bcrypt
- Default password for all sample accounts: `password123` (except admin: `admin123`)
- Replace image URLs with your actual Cloudinary URLs after uploading images
- Update ObjectId values if needed for your specific use case
- Adjust dates to match your testing requirements
