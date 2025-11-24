from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['Shop']

print("Valid product IDs in database:")
products = list(db.products.find().limit(5))
for p in products:
    print(f"  - {p['_id']}: {p['name']}")

# Kiểm tra product ID từ frontend
test_id = "673b1234567890abcdef1001"
print(f"\nChecking if {test_id} exists:")
try:
    product = db.products.find_one({"_id": ObjectId(test_id)})
    if product:
        print(f"✅ Found: {product['name']}")
    else:
        print("❌ Not found in database")
except Exception as e:
    print(f"❌ Invalid ObjectId: {e}")

client.close()
