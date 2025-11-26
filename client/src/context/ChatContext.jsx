import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Toggle chat modal
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    // Clear error when opening
    if (!isOpen) setError(null);
  }, [isOpen]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Send message to backend
  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    // Add user message immediately
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Get conversation history (last 5 messages, excluding the current one)
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: userMessage,
          conversation_history: conversationHistory,
          include_context: true
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data.success) {
        const assistantMsg = {
          role: 'assistant',
          content: response.data.message,
          timestamp: response.data.timestamp,
          sources: response.data.sources || []
        };
        
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(response.data.error || 'Không thể nhận phản hồi từ chatbot');
      }
    } catch (err) {
      console.error('Chat API Error:', err);
      
      let errorMessage = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Yêu cầu timeout. Vui lòng thử lại.';
      } else if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.detail || err.response.data?.error || errorMessage;
      } else if (err.request) {
        // No response received
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      }
      
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, API_BASE_URL]);

  // Send message with streaming (for future implementation)
  const sendMessageStream = useCallback(async (userMessage) => {
    // This will be implemented in Task 14
    // For now, fallback to regular sendMessage
    return sendMessage(userMessage);
  }, [sendMessage]);

  const value = {
    isOpen,
    messages,
    isLoading,
    error,
    toggleChat,
    clearMessages,
    sendMessage,
    sendMessageStream
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for using chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export default ChatContext;
