import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Send, Globe2 } from 'lucide-react';

export default function ChatRoom({ peerInfo, messages, setMessages }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Language display map
  const langNames = { en: 'English', te: 'Telugu', hinglish: 'Hinglish' };
  const peerLangName = langNames[peerInfo?.peerLanguage] || 'Unknown';

  // Listen for incoming messages
  useEffect(() => {
    const handleReceive = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    socket.on('receive_message', handleReceive);
    
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    socket.emit('send_message', { text: inputText.trim() });
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-primary text-textLight relative">
      {/* Sticky Header */}
      <div className="bg-secondary p-3 text-center border-b border-slate-800 shadow-sm z-10 flex flex-col items-center sticky top-0">
        <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">
          Topic: {peerInfo?.topic || 'General'}
        </p>
        <p className="text-[10px] text-textMuted flex items-center gap-1">
          <Globe2 size={12} /> Auto-translating from {peerLangName}
        </p>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="text-center text-xs text-textMuted my-4 bg-slate-800/50 py-2 rounded-full w-3/4 mx-auto border border-slate-700/50">
          You are connected securely. Say hello!
        </div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === socket.id;
          
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                isMe 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(37,99,235,0.3)]' 
                  : 'bg-secondary border border-slate-700 text-textLight rounded-bl-none shadow-md'
              }`}>
                {/* Translated/Primary Text */}
                <p className="text-sm leading-relaxed">{msg.translatedText}</p>
                
                {/* Original Text Subtitle (Only show if it was actually translated and not sent by me) */}
                {!isMe && msg.originalText !== msg.translatedText && (
                  <p className="text-[10px] opacity-70 italic mt-1 pt-1 border-t border-slate-600/30">
                    {msg.originalText}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Bottom Input Bar */}
      <div className="absolute bottom-0 w-full p-4 bg-secondary border-t border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-primary border border-slate-700 rounded-full px-5 py-3 text-sm text-textLight focus:outline-none focus:border-accent shadow-inner transition-colors placeholder:text-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-accent disabled:opacity-50 disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-accentHover text-white p-3 rounded-full w-12 h-12 flex items-center justify-center active:scale-95 transition-all shadow-lg"
          >
            <Send size={18} className={inputText.trim() ? "translate-x-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
