# 📸 HƯỚNG DẪN QUẢN LÝ HÌNH ẢNH TRONG VELOURA E-COMMERCE

## 🎯 Tổng quan hệ thống

Hệ thống sử dụng **Cloudinary** để lưu trữ và quản lý hình ảnh:
- **Backend (FastAPI)**: Upload ảnh lên Cloudinary, trả về URL
- **MongoDB**: Lưu array các URL hình ảnh
- **Frontend (React)**: Hiển thị ảnh từ URL Cloudinary

---

## 📁 Cấu trúc dữ liệu trong MongoDB

### Product Schema:
```json
{
  "_id": "673b1234567890abcdef1001",
  "name": "Men's Premium Cotton Basic T-Shirt",
  "description": "Men's t-shirt made from 100% premium...",
  "image": [
    "https://res.cloudinary.com/veloura/image/upload/v1/products/ao-thun-basic-1.jpg",
    "https://res.cloudinary.com/veloura/image/upload/v1/products/ao-thun-basic-2.jpg"
  ],
  "price": 299000,
  "offerPrice": 249000,
  "category": "Men's T-Shirts",
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "popular": true
}
```

**Lưu ý:** `image` là một **array** chứa nhiều URL hình ảnh.

---

## 🔍 CÁCH 1: KIỂM TRA DỮ LIỆU HÌNH ẢNH

### 1.1. Kiểm tra qua MongoDB Compass
```
1. Mở MongoDB Compass
2. Kết nối: mongodb://localhost:27017
3. Chọn database: Shop
4. Chọn collection: products
5. Xem field "image" của mỗi document
```

### 1.2. Kiểm tra qua Python Script
Tạo file: `fastapi-backend/check_images.py`

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_images():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client["Shop"]
    products = db["products"]
    
    print("=" * 60)
    print("📸 KIỂM TRA HÌNH ẢNH SẢN PHẨM")
    print("=" * 60)
    
    all_products = await products.find({}).to_list(length=None)
    
    for product in all_products:
        print(f"\n✓ {product['name']}")
        print(f"  ID: {product['_id']}")
        print(f"  Images: {len(product.get('image', []))} ảnh")
        
        for idx, img_url in enumerate(product.get('image', []), 1):
            print(f"    [{idx}] {img_url}")
    
    print(f"\n📊 Tổng: {len(all_products)} sản phẩm")
    client.close()

asyncio.run(check_images())
```

**Chạy:** `python check_images.py`

### 1.3. Kiểm tra qua API
```bash
# Lấy danh sách tất cả sản phẩm
curl http://localhost:8000/api/product/list

# Lấy chi tiết 1 sản phẩm
curl http://localhost:8000/api/product/673b1234567890abcdef1001
```

---

## 📤 CÁCH 2: THÊM HÌNH ẢNH VÀO MONGODB

### 2.1. Cấu hình Cloudinary (nếu chưa có)

File: `fastapi-backend/.env`
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Lấy credentials:**
1. Đăng ký tài khoản: https://cloudinary.com
2. Vào Dashboard → Account Details
3. Copy Cloud Name, API Key, API Secret

### 2.2. Thêm sản phẩm có ảnh qua API (Postman/Thunder Client)

**Endpoint:** `POST http://localhost:8000/api/product/add`

**Headers:**
- Cookie: `token=<admin_token>` (login admin trước)

**Body (form-data):**
```
productData: {
  "name": "New Product",
  "description": "Product description",
  "price": 500000,
  "offerPrice": 450000,
  "category": "Men's T-Shirts",
  "sizes": ["S", "M", "L"],
  "popular": true
}

images: [file1.jpg, file2.jpg]  // Upload nhiều ảnh
```

### 2.3. Thêm sản phẩm qua Admin Panel (Frontend)

File hiện tại: `client/src/pages/admin/AddProduct.jsx`

Kiểm tra xem đã có form upload ảnh chưa:

```jsx
<input 
  type="file" 
  multiple 
  accept="image/*"
  onChange={handleImageChange}
/>
```

### 2.4. Thêm ảnh trực tiếp vào MongoDB (Testing)

Tạo file: `fastapi-backend/add_sample_images.py`

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_product_images():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client["Shop"]
    products = db["products"]
    
    # Thêm ảnh cho sản phẩm đầu tiên
    product_id = "673b1234567890abcdef1001"
    
    new_images = [
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        "https://res.cloudinary.com/demo/image/upload/sample2.jpg"
    ]
    
    result = await products.update_one(
        {"_id": product_id},
        {"$set": {"image": new_images}}
    )
    
    print(f"✅ Updated {result.modified_count} product(s)")
    client.close()

asyncio.run(update_product_images())
```

---

## 🎨 CÁCH 3: HIỂN THỊ HÌNH ẢNH LÊN FRONTEND

### 3.1. Component hiển thị sản phẩm

File: `client/src/components/Item.jsx`

```jsx
const Item = ({ product }) => {
  return (
    <div className="product-card">
      {/* Hiển thị ảnh đầu tiên */}
      <img 
        src={product.image[0]} 
        alt={product.name}
        onError={(e) => {
          e.target.src = '/placeholder.png'; // Fallback image
        }}
      />
      
      <h3>{product.name}</h3>
      <p>{product.offerPrice} VND</p>
    </div>
  );
};
```

### 3.2. Product Details với nhiều ảnh

```jsx
const ProductDetails = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  
  return (
    <div>
      {/* Ảnh chính */}
      <img src={product.image[selectedImage]} alt="" />
      
      {/* Thumbnails */}
      <div className="thumbnails">
        {product.image.map((img, index) => (
          <img 
            key={index}
            src={img}
            onClick={() => setSelectedImage(index)}
            className={selectedImage === index ? 'active' : ''}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3.3. Lazy Loading Images

```jsx
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

<LazyLoadImage
  src={product.image[0]}
  alt={product.name}
  effect="blur"
  placeholderSrc="/placeholder.png"
/>
```

---

## 🔧 TROUBLESHOOTING

### ❌ Ảnh không hiển thị?

**1. Kiểm tra URL hợp lệ:**
```javascript
console.log('Image URL:', product.image[0]);
// Nên bắt đầu với: https://res.cloudinary.com/
```

**2. Kiểm tra CORS:**
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**3. Kiểm tra Cloudinary config:**
```python
# fastapi-backend/app/config/cloudinary.py
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

async def upload_image(file_content, folder="veloura/products"):
    result = cloudinary.uploader.upload(
        file_content,
        folder=folder
    )
    return result['secure_url']
```

### ❌ Upload ảnh thất bại?

1. Check Cloudinary credentials trong `.env`
2. Check file size (max 10MB thường)
3. Check file format (jpg, png, webp)
4. Check internet connection

---

## 📊 KIỂM TRA HIỆU SUẤT

### Optimize Cloudinary URLs:
```javascript
// Thêm transformation vào URL
const optimizedUrl = product.image[0]
  .replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/');

// w_400: width 400px
// h_400: height 400px  
// c_fill: crop to fill
// q_auto: auto quality
// f_auto: auto format (WebP cho browser hỗ trợ)
```

---

## 🎯 KẾT LUẬN

**Flow hoàn chỉnh:**
1. Admin upload ảnh qua form
2. Frontend gửi file lên Backend (FastAPI)
3. Backend upload lên Cloudinary
4. Cloudinary trả về URL
5. Backend lưu URL vào MongoDB
6. Frontend fetch data từ API
7. Hiển thị ảnh từ Cloudinary URL

**Ưu điểm:**
✅ Cloudinary handle CDN, optimization tự động
✅ MongoDB chỉ lưu URL nhẹ
✅ Không tốn storage server
✅ Load nhanh với CDN global
