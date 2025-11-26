"""
Chat API Routes for RAG Chatbot
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import google.generativeai as genai
import asyncio
import json
import logging
from typing import AsyncGenerator

from app.config.settings import settings
from app.models.chat import ChatRequest, ChatResponse, ContextSource, ErrorResponse, StreamChunk
from app.services.rag_service import retrieve_context, search_all_collections

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


def build_prompt(user_message: str, context: str, conversation_history: list = None) -> str:
    """
    Build prompt for Gemini with RAG context and conversation history.
    """
    system_prompt = """Bạn là trợ lý AI thông minh cho cửa hàng thời trang Veloura. 
Nhiệm vụ của bạn là giúp khách hàng tìm sản phẩm, trả lời câu hỏi về thời trang, và tư vấn mua sắm.

HƯỚNG DẪN:
- Luôn thân thiện, nhiệt tình và chuyên nghiệp
- Sử dụng thông tin từ CONTEXT bên dưới để trả lời chính xác
- **QUAN TRỌNG**: Khi giới thiệu sản phẩm, PHẢI liệt kê TẤT CẢ sản phẩm có trong CONTEXT, KHÔNG được bỏ sót
- Format mỗi sản phẩm thành mục có số thứ tự rõ ràng
- Mỗi sản phẩm PHẢI bao gồm: tên, giá, và link (nếu có trong context)
- Format link như sau: 🔗 Xem chi tiết: [link]
- Nếu hỏi về giá, nêu rõ giá bằng VNĐ (ví dụ: 500,000₫)
- Nếu không có thông tin trong CONTEXT, hãy nói rõ và đưa ra gợi ý chung
- Trả lời ngắn gọn, súc tích, dễ hiểu
- Không bịa đặt thông tin không có trong CONTEXT

VÍ DỤ FORMAT RESPONSE:
Dạ, em tìm thấy các sản phẩm áo thun nam sau:

1. **Áo Thun Basic Nam**
   - Giá: 250,000₫
   - 🔗 Xem chi tiết: http://localhost:5173/product/123

2. **Áo Thun Polo Nam**
   - Giá: 350,000₫
   - 🔗 Xem chi tiết: http://localhost:5173/product/456

3. **Áo Thun Dệt Kim**
   - Giá: 299,000₫
   - 🔗 Xem chi tiết: http://localhost:5173/product/789

"""
    
    # Add conversation history if available
    if conversation_history:
        history_text = "\n\nLỊCH SỬ HỘI THOẠI:\n"
        for msg in conversation_history[-5:]:  # Last 5 messages
            role = "Người dùng" if msg.role == "user" else "Trợ lý"
            history_text += f"{role}: {msg.content}\n"
        system_prompt += history_text
    
    # Add context
    prompt = f"""{system_prompt}

CONTEXT (Thông tin từ cơ sở dữ liệu):
{context}

---

Câu hỏi của khách hàng: {user_message}

Trả lời (bằng tiếng Việt):"""
    
    return prompt


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint with RAG (Retrieval-Augmented Generation).
    
    - Nhận tin nhắn từ người dùng
    - Tìm kiếm thông tin liên quan trong database (RAG)
    - Gọi Gemini API để tạo câu trả lời
    - Trả về response kèm sources
    """
    try:
        logger.info(f"Chat request: '{request.message[:50]}...'")
        
        # Step 1: Retrieve context from vector search
        context = ""
        sources = []
        
        if request.include_context:
            # Search all collections with more results
            search_results = await search_all_collections(request.message, top_k_per_collection=5)
            
            # Extract sources
            for collection_name, results in search_results.items():
                for doc in results:
                    sources.append(ContextSource(
                        collection=collection_name,
                        id=doc.get("_id", ""),
                        title=doc.get("name") or doc.get("title", ""),
                        score=doc.get("score", 0.0)
                    ))
            
            # Format context
            context = await retrieve_context(request.message, top_k=5)
        
        # Step 2: Build prompt
        prompt = build_prompt(
            user_message=request.message,
            context=context,
            conversation_history=request.conversation_history
        )
        
        # Step 3: Call Gemini API
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        response = await asyncio.to_thread(
            model.generate_content,
            prompt
        )
        
        assistant_message = response.text
        
        logger.info(f"Generated response ({len(assistant_message)} chars)")
        
        return ChatResponse(
            success=True,
            message=assistant_message,
            sources=sources[:5]  # Return top 5 sources
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


async def generate_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Generate streaming response from Gemini.
    """
    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            stream=True
        )
        
        for chunk in response:
            if chunk.text:
                # Send as Server-Sent Events format
                data = StreamChunk(content=chunk.text, done=False)
                yield f"data: {data.model_dump_json()}\n\n"
                await asyncio.sleep(0.01)  # Small delay for smooth streaming
        
        # Send final chunk
        final_chunk = StreamChunk(content="", done=True)
        yield f"data: {final_chunk.model_dump_json()}\n\n"
        
    except Exception as e:
        logger.error(f"Streaming error: {str(e)}")
        error_chunk = StreamChunk(content=f"Error: {str(e)}", done=True)
        yield f"data: {error_chunk.model_dump_json()}\n\n"


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint with Server-Sent Events (SSE).
    
    - Trả về response theo từng chunk
    - Tốt hơn cho UX (người dùng thấy response từ từ)
    - Sử dụng EventSource ở frontend để nhận
    """
    try:
        logger.info(f"Stream request: '{request.message[:50]}...'")
        
        # Retrieve context
        context = ""
        if request.include_context:
            context = await retrieve_context(request.message, top_k=3)
        
        # Build prompt
        prompt = build_prompt(
            user_message=request.message,
            context=context,
            conversation_history=request.conversation_history
        )
        
        # Return streaming response
        return StreamingResponse(
            generate_stream(prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except Exception as e:
        logger.error(f"Stream error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Streaming failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for chat service.
    """
    try:
        # Test Gemini API
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = await asyncio.to_thread(
            model.generate_content,
            "Hello"
        )
        
        return {
            "success": True,
            "status": "healthy",
            "gemini_api": "connected",
            "model": settings.GEMINI_MODEL
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }
