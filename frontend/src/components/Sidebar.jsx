import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, X, Clock } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, onSelectChat, onNewChat }) {
  const [history, setHistory] = useState([]);

  // Poll for history changes (since ChatRoom updates localStorage on the fly)
  useEffect(() => {
    const loadHistory = () => {
      const saved = localStorage.getItem('safespeak_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved).sort((a, b) => b.id - a.id);
          setHistory(parsed);
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      } else {
        setHistory([]);
      }
    };
    
    loadHistory();
    // Refresh history every 2 seconds to catch updates from active chat
    const interval = setInterval(loadHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to permanently delete all your chat history?")) {
      localStorage.removeItem('safespeak_history');
      setHistory([]);
      onNewChat(); // Reset to home if they were viewing a chat
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#101a1a]/95 backdrop-blur-xl border-r border-white/10 shadow-2xl transition-transform duration-300 md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header / New Chat */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button 
            onClick={onNewChat}
            className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-[#f6f2e9] shadow-sm transition-colors hover:bg-white/10 border border-white/5"
          >
            <Plus size={16} />
            New Chat
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="ml-2 rounded-full p-2 text-[#b7c5b4] hover:bg-white/10 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-[#b7c5b4]/60">
            Recent
          </div>
          
          {history.length === 0 ? (
            <div className="px-2 py-4 text-sm text-[#b7c5b4]/60 text-center italic">
              No past chats yet.
            </div>
          ) : (
            history.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectChat(session)}
                className="group flex w-full flex-col gap-1 rounded-xl p-3 text-left transition-colors hover:bg-white/5 border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-[#f6f2e9]">
                  <MessageSquare size={14} className="opacity-70 text-[#b7c5b4]" />
                  <span className="truncate">Chat Session</span>
                </div>
                <div className="flex items-center gap-1 pl-6 text-xs text-[#b7c5b4]">
                  <Clock size={10} />
                  {new Date(session.id).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer / Clear History */}
        {history.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={clearHistory}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8795d]/20 px-4 py-3 text-sm font-semibold text-[#e8795d] transition-colors hover:bg-[#e8795d]/10"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          </div>
        )}
      </div>
    </>
  );
}
