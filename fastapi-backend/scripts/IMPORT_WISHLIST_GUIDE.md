# HƯỚNG DẪN IMPORT WISHLIST MẪU VÀO MONGODB

## 📋 Thông tin

- **User:** Dan (dnldna05@gmail.com)
- **User ID:** 690cd1522ef08cb266263c2d
- **Database:** Shop
- **Collection:** wishlists
- **Số sản phẩm:** 6 products

---

## 🔧 CÁCH 1: Import bằng MongoDB Compass (Recommended)

### Bước 1: Mở MongoDB Compass
- Kết nối: `mongodb://localhost:27017`
- Chọn database: **Shop**

### Bước 2: Tạo collection `wishlists` (nếu chưa có)
- Click "Create Collection"
- Tên collection: `wishlists`

### Bước 3: Import document
1. Click vào collection **`wishlists`**
2. Click nút **"ADD DATA"** → **"Insert Document"**
3. Copy toàn bộ nội dung file `sample_wishlist.json`
4. Paste vào MongoDB Compass
5. Click **"Insert"**

### ⚠️ Lưu ý quan trọng:
**THAY ĐỔI `productId`** trong file JSON bằng ID thật từ collection `products`:

1. Mở collection **`products`** trong MongoDB Compass
2. Copy 6 `_id` của sản phẩm bất kỳ
3. Thay thế trong file JSON:
   ```json
   "productId": "673b2345678901234567890a"  ← Thay bằng _id thật
   ```

---

## 🔧 CÁCH 2: Import bằng MongoDB Shell (mongosh)

### Bước 1: Mở MongoDB Shell
```bash
mongosh
```

### Bước 2: Chọn database
```javascript
use Shop
```

### Bước 3: Lấy 6 product IDs
```javascript
// Lấy 6 sản phẩm random
db.products.find({}, {_id: 1, name: 1}).limit(6).toArray()
```

**Copy 6 IDs hiển thị**, ví dụ:
```
ObjectId('673b123...')
ObjectId('673b456...')
...
```

### Bước 4: Insert wishlist document
```javascript
db.wishlists.insertOne({
  userId: "690cd1522ef08cb266263c2d",
  products: [
    {
      productId: "ID_SẢN_PHẨM_1",  // ← Thay bằng ID thật
      addedAt: new Date("2025-11-10T10:00:00.000Z")
    },
    {
      productId: "ID_SẢN_PHẨM_2",  // ← Thay bằng ID thật
      addedAt: new Date("2025-11-10T09:55:00.000Z")
    },
    {
      productId: "ID_SẢN_PHẨM_3",
      addedAt: new Date("2025-11-10T09:50:00.000Z")
    },
    {
      productId: "ID_SẢN_PHẨM_4",
      addedAt: new Date("2025-11-10T09:45:00.000Z")
    },
    {
      productId: "ID_SẢN_PHẨM_5",
      addedAt: new Date("2025-11-10T09:40:00.000Z")
    },
    {
      productId: "ID_SẢN_PHẨM_6",
      addedAt: new Date("2025-11-10T09:35:00.000Z")
    }
  ],
  createdAt: new Date("2025-11-10T09:30:00.000Z"),
  updatedAt: new Date("2025-11-10T10:00:00.000Z")
})
```

### Bước 5: Verify
```javascript
db.wishlists.find({userId: "690cd1522ef08cb266263c2d"}).pretty()
```

---

## 🔧 CÁCH 3: Script tự động lấy random products

Copy script này vào mongosh:

```javascript
use Shop

// Lấy user Dan
const user = db.users.findOne({email: "dnldna05@gmail.com"});
const userId = user._id.toString();

// Lấy 6 products random
const products = db.products.aggregate([
  { $sample: { size: 6 } },
  { $project: { _id: 1 } }
]).toArray();

// Tạo wishlist products array
const wishlistProducts = products.map((product, index) => {
  const addedTime = new Date();
  addedTime.setMinutes(addedTime.getMinutes() - (6 - index) * 5);
  
  return {
    productId: product._id.toString(),
    addedAt: addedTime
  };
});

// Insert wishlist
db.wishlists.insertOne({
  userId: userId,
  products: wishlistProducts,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ Wishlist created successfully!");
print("Total products: " + wishlistProducts.length);
```

---

## ✅ Verify sau khi import

### Check trong MongoDB:
```javascript
db.wishlists.find({userId: "690cd1522ef08cb266263c2d"}).pretty()
```

### Test trên Frontend:
1. Login với account Dan
2. Icon wishlist phải hiện **badge số 6**
3. Click icon wishlist → Navigate to `/wishlist`
4. Phải thấy 6 sản phẩm hiển thị

---

## 🗑️ Xóa wishlist (nếu cần làm lại)

```javascript
db.wishlists.deleteOne({userId: "690cd1522ef08cb266263c2d"})
```

---

## 📝 Notes

- `userId` phải match với `_id` của user Dan trong collection `users`
- `productId` phải tồn tại trong collection `products`
- `addedAt` sắp xếp từ mới → cũ (mới nhất lên đầu trong wishlist page)
- Collection `wishlists` tự động được tạo khi insert document đầu tiên

---

## 🎯 Recommended: CÁCH 3 (Script tự động)

Đây là cách nhanh nhất và chính xác nhất vì:
- ✅ Tự động lấy user Dan's ID
- ✅ Random 6 products có sẵn
- ✅ Không cần thay đổi ID thủ công
- ✅ Timestamp chính xác

**Copy script ở CÁCH 3 → Paste vào mongosh → Enter** 🚀
