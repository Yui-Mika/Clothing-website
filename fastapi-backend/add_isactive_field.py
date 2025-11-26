from pymongo import MongoClient
from app.config.settings import settings

# Kết nối MongoDB
client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]
products_collection = db.products

# Đếm products trước khi update
total = products_collection.count_documents({})
without_isactive = products_collection.count_documents({"isActive": {"$exists": False}})

print(f"📊 Tổng số products: {total}")
print(f"📊 Products không có isActive: {without_isactive}")

# Thêm field isActive=True cho tất cả products
result = products_collection.update_many(
    {},  # Tất cả documents
    {"$set": {"isActive": True}}  # Thêm/update field isActive=True
)

print(f"\n✅ Đã update {result.modified_count} products")
print(f"✅ Matched {result.matched_count} products")

# Verify sau khi update
with_isactive = products_collection.count_documents({"isActive": True})
print(f"\n✅ Products có isActive=True: {with_isactive}")

client.close()
