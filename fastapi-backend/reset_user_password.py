"""
Script to reset user password with new bcrypt version
Usage: python reset_user_password.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.auth import get_password_hash
from app.config.settings import settings

async def reset_password():
    """Reset password for a user"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_collection = db["users"]
    
    # Get user email
    email = input("Enter user email to reset password: ").strip()
    
    # Check if user exists
    user = await users_collection.find_one({"email": email})
    if not user:
        print(f"❌ User with email '{email}' not found!")
        return
    
    # Get new password
    new_password = input("Enter new password: ").strip()
    confirm_password = input("Confirm new password: ").strip()
    
    if new_password != confirm_password:
        print("❌ Passwords do not match!")
        return
    
    if len(new_password) < 6:
        print("❌ Password must be at least 6 characters!")
        return
    
    # Hash new password
    hashed_password = get_password_hash(new_password)
    
    # Update password in database
    result = await users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Password updated successfully for user: {email}")
        print(f"👤 User name: {user.get('name', 'N/A')}")
        print(f"📧 Email: {email}")
        print(f"🔐 New password: {new_password}")
    else:
        print("❌ Failed to update password!")
    
    client.close()

async def create_test_user():
    """Create a test user with new password hash"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_collection = db["users"]
    
    # Test user data
    test_email = "test@example.com"
    test_password = "password123"
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": test_email})
    if existing_user:
        print(f"⚠️  User '{test_email}' already exists. Use option 1 to reset password.")
        client.close()
        return
    
    # Create new user
    hashed_password = get_password_hash(test_password)
    new_user = {
        "name": "Test User",
        "email": test_email,
        "password": hashed_password,
        "role": "user",
        "emailVerified": True,
        "isActive": True,
        "createdAt": "2025-11-05T00:00:00",
        "updatedAt": "2025-11-05T00:00:00"
    }
    
    result = await users_collection.insert_one(new_user)
    
    if result.inserted_id:
        print("✅ Test user created successfully!")
        print(f"📧 Email: {test_email}")
        print(f"🔐 Password: {test_password}")
    else:
        print("❌ Failed to create test user!")
    
    client.close()

async def main():
    print("\n" + "="*50)
    print("🔐 USER PASSWORD MANAGEMENT")
    print("="*50)
    print("\nOptions:")
    print("1. Reset password for existing user")
    print("2. Create test user (test@example.com)")
    print("3. Exit")
    print()
    
    choice = input("Select option (1-3): ").strip()
    
    if choice == "1":
        await reset_password()
    elif choice == "2":
        await create_test_user()
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid option!")

if __name__ == "__main__":
    asyncio.run(main())
