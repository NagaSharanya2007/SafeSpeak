import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Clock, MessageSquare } from 'lucide-react';

export default function ChatHistory({ onBack }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('safespeak_history');
    if (saved) {
      try {
        // Sort sessions from newest to oldest
        const parsed = JSON.parse(saved).sort((a, b) => b.id - a.id);
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to permanently delete all your chat history?")) {
      localStorage.removeItem('safespeak_history');
      setHistory([]);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#FFF8F3] px-6 py-10 text-[#1A362B] md:px-24 md:py-20">
      
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button 
            onClick={onBack}
            className="group mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#B84A28] transition-colors hover:text-[#8a351c]"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> 
            Back to Home
          </button>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold tracking-tight text-[#1A362B]">
            Your Chat History
          </h1>
          <p className="mt-4 max-w-xl font-sans text-lg text-[#2D4A3E]/70 leading-relaxed">
            All conversations are saved securely and locally on this device. We do not store this data on our servers.
          </p>
        </div>

        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 rounded-full border-2 border-[#B84A28] px-6 py-3 font-sans font-bold text-[#B84A28] transition-all hover:bg-[#B84A28] hover:text-[#FFF8F3] active:scale-95 self-start md:self-end"
          >
            <Trash2 size={18} />
            Clear History
          </button>
        )}
      </div>

      {/* History List */}
      <div className="mx-auto w-full max-w-4xl space-y-8 pb-20">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#1A362B]/10 bg-white/50 p-16 text-center shadow-sm">
            <MessageSquare size={48} className="mb-4 text-[#B84A28]/30" />
            <h3 className="font-playfair text-2xl font-bold text-[#1A362B]">No History Found</h3>
            <p className="mt-2 text-[#2D4A3E]/70">You haven't had any conversations on this device yet.</p>
          </div>
        ) : (
          history.map((session) => (
            <div key={session.id} className="overflow-hidden rounded-3xl border border-[#1A362B]/10 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 border-b border-[#1A362B]/5 bg-[#FFF8F3]/50 px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider text-[#B84A28]">
                <Clock size={14} />
                {new Date(session.id).toLocaleString()}
                <span className="ml-auto rounded-full bg-[#1A362B]/5 px-3 py-1 text-[#1A362B]">
                  {session.messages.length} messages
                </span>
              </div>
              
              <div className="flex max-h-96 flex-col gap-4 overflow-y-auto p-6 bg-white">
                {session.messages.map((msg, idx) => (
                  <div key={idx} className={`flex w-full ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.isMe 
                        ? 'rounded-br-sm bg-[#FFF8F3] text-[#1A362B] border border-[#1A362B]/10' 
                        : 'rounded-bl-sm bg-[#A3C4AC]/20 text-[#1A362B]'
                    }`}>
                      <p className="font-sans text-sm leading-relaxed">{msg.translatedText}</p>
                      {!msg.isMe && msg.originalText !== msg.translatedText && (
                        <p className="mt-2 border-t border-[#1A362B]/10 pt-1 text-[10px] italic opacity-70">
                          {msg.originalText}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
