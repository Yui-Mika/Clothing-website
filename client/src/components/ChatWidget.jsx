import React from 'react';
import { useChat } from '../context/ChatContext';
import logo from '../assets/logo.png';

const ChatWidget = () => {
  const { isOpen, toggleChat, messages } = useChat();

  // Don't show widget if chat is open (modal will be visible instead)
  if (isOpen) return null;

  // Show unread badge if there are messages
  const hasMessages = messages.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={toggleChat}
        className="group relative bg-white hover:bg-gray-50 text-gray-800 rounded-full p-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 ease-out flex items-center justify-center border-2 border-gray-200"
        aria-label="Open chat"
      >
        {/* Logo Icon */}
        <img 
          src={logo} 
          alt="Chat" 
          className="w-8 h-8 object-contain"
        />
        
        {/* Unread Badge */}
        {hasMessages && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
        
        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Chat với chúng tôi
        </span>
      </button>
    </div>
  );
};

export default ChatWidget;
