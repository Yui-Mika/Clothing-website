import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Send, Trash2 } from 'lucide-react';
import logo from '../assets/logo.png';

const ChatModal = () => {
  const { isOpen, toggleChat, messages, isLoading, sendMessage, clearMessages } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) {
      clearMessages();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={toggleChat}
      />
      
      {/* Chat Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gray-200 text-gray-800 px-6 py-4 rounded-t-2xl flex items-center justify-between border-b border-gray-300">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h3 className="font-semibold text-lg">Veloura Assistant</h3>
              <p className="text-xs text-gray-600">Luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 hover:bg-gray-300 rounded-lg transition-colors"
                title="Xóa lịch sử chat"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={toggleChat}
              className="p-2 hover:bg-gray-300 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain mb-4 opacity-50" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">
                Chào mừng đến với Veloura!
              </h4>
              <p className="text-sm text-gray-500">
                Tôi có thể giúp bạn tìm kiếm sản phẩm, trả lời câu hỏi về đơn hàng và nhiều hơn nữa.
              </p>
              <div className="mt-6 space-y-2 w-full">
                <button
                  onClick={() => sendMessage('Tôi muốn tìm áo thun nam')}
                  className="w-full p-3 text-sm bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
                >
                  💡 Tôi muốn tìm áo thun nam
                </button>
                <button
                  onClick={() => sendMessage('Có khuyến mãi gì không?')}
                  className="w-full p-3 text-sm bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
                >
                  🎁 Có khuyến mãi gì không?
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gray-200'
                      : msg.isError
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-white shadow-sm'
                  }`}
                >                  <div 
                    className={`text-sm whitespace-pre-wrap break-words ${
                      msg.role === 'user' ? 'text-gray-800' : msg.isError ? 'text-red-700' : 'text-gray-800'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: msg.content.replace(
                        /(https?:\/\/[^\s]+)/g,
                        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
                      )
                    }}
                  />
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-200 border-t border-gray-300 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Powered by Google Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
