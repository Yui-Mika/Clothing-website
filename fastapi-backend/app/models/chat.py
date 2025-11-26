"""
Pydantic models for Chat API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """Single chat message."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "Tôi đang tìm áo thun nam cotton",
                "timestamp": "2025-11-26T10:30:00"
            }
        }


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=[],
        description="Previous messages in conversation (optional, max 10)"
    )
    include_context: bool = Field(
        default=True,
        description="Whether to include RAG context from vector search"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Cho tôi xem áo khoác nam",
                "conversation_history": [],
                "include_context": True
            }
        }


class ContextSource(BaseModel):
    """Source document used in RAG context."""
    collection: str = Field(..., description="Collection name (products/blogs/categories)")
    id: str = Field(..., description="Document ID")
    title: str = Field(..., description="Document title/name")
    score: float = Field(..., description="Relevance score")
    
    class Config:
        json_schema_extra = {
            "example": {
                "collection": "products",
                "id": "673b1234567890abcdef0001",
                "title": "Áo Thun Nam Cotton",
                "score": 0.85
            }
        }


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    success: bool = Field(default=True)
    message: str = Field(..., description="AI assistant's response")
    sources: List[ContextSource] = Field(
        default=[],
        description="Documents used to generate the response"
    )
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Chúng tôi có nhiều mẫu áo thun nam cotton...",
                "sources": [
                    {
                        "collection": "products",
                        "id": "673b1234567890abcdef0001",
                        "title": "Áo Thun Nam Cotton Premium",
                        "score": 0.89
                    }
                ],
                "timestamp": "2025-11-26T10:30:05"
            }
        }


class StreamChunk(BaseModel):
    """Single chunk of streamed response."""
    content: str = Field(..., description="Chunk of text content")
    done: bool = Field(default=False, description="Whether streaming is complete")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Chúng tôi có",
                "done": False
            }
        }


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = Field(default=False)
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Invalid request",
                "detail": "Message cannot be empty"
            }
        }
