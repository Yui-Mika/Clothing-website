from fastapi import APIRouter, Depends, HTTPException, status
from app.models.contact import ContactCreate, ContactUpdate
from app.config.database import get_collection
from app.middleware.auth_admin import auth_staff
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/submit", response_model=dict)
async def submit_contact(contact: ContactCreate):
    """Submit contact form"""
    contacts_collection = await get_collection("contacts")
    
    # Create contact document
    contact_doc = {
        "name": contact.name,
        "email": contact.email,
        "phone": contact.phone,
        "subject": contact.subject,
        "message": contact.message,
        "status": "pending",
        "isRead": False,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await contacts_collection.insert_one(contact_doc)
    
    return {
        "success": True,
        "message": "Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất!",
        "contactId": str(result.inserted_id)
    }

@router.get("/list", response_model=dict)
async def get_all_contacts(staff: dict = Depends(auth_staff)):
    """Get all contact submissions (Staff/Admin only)"""
    contacts_collection = await get_collection("contacts")
    
    contacts = await contacts_collection.find({}).sort("createdAt", -1).to_list(length=None)
    
    for contact in contacts:
        contact["_id"] = str(contact["_id"])
    
    return {
        "success": True,
        "contacts": contacts
    }

@router.get("/unread-count", response_model=dict)
async def get_unread_count(staff: dict = Depends(auth_staff)):
    """Get count of unread contacts (Staff/Admin only)"""
    contacts_collection = await get_collection("contacts")
    
    count = await contacts_collection.count_documents({"isRead": False})
    
    return {
        "success": True,
        "count": count
    }

@router.get("/{contact_id}", response_model=dict)
async def get_contact(contact_id: str, staff: dict = Depends(auth_staff)):
    """Get single contact (Staff/Admin only)"""
    contacts_collection = await get_collection("contacts")
    
    contact = await contacts_collection.find_one({"_id": ObjectId(contact_id)})
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin nhắn liên hệ"
        )
    
    # Mark as read
    await contacts_collection.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {"isRead": True, "updatedAt": datetime.utcnow()}}
    )
    
    contact["_id"] = str(contact["_id"])
    
    return {
        "success": True,
        "contact": contact
    }

@router.put("/{contact_id}/status", response_model=dict)
async def update_contact_status(
    contact_id: str,
    status: str,
    staff: dict = Depends(auth_staff)
):
    """Update contact status (Staff/Admin only)"""
    contacts_collection = await get_collection("contacts")
    
    # Validate status
    valid_statuses = ["pending", "in-progress", "resolved"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trạng thái không hợp lệ"
        )
    
    result = await contacts_collection.update_one(
        {"_id": ObjectId(contact_id)},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin nhắn liên hệ"
        )
    
    return {
        "success": True,
        "message": "Cập nhật trạng thái liên hệ thành công"
    }

@router.delete("/{contact_id}", response_model=dict)
async def delete_contact(contact_id: str, staff: dict = Depends(auth_staff)):
    """Delete contact (Staff/Admin only)"""
    contacts_collection = await get_collection("contacts")
    
    result = await contacts_collection.delete_one({"_id": ObjectId(contact_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin nhắn liên hệ"
        )
    
    return {
        "success": True,
        "message": "Xóa tin nhắn liên hệ thành công"
    }
