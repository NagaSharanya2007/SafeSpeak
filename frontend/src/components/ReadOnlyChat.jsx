import React from 'react';
import { Clock } from 'lucide-react';

export default function ReadOnlyChat({ session }) {
  if (!session) return null;

  return (
    <div className="flex h-full w-full flex-col bg-[#FFF8F3] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#1A362B]/10 bg-white/50 px-6 py-4 shadow-sm z-10 sticky top-0 md:pl-6 pl-16">
        <div>
          <h2 className="font-playfair text-xl font-bold text-[#1A362B]">
            Past Chat Session
          </h2>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#B84A28]">
            <Clock size={12} />
            {new Date(session.id).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {session.messages.length === 0 ? (
          <div className="text-center text-[#1A362B]/50 italic mt-10">No messages in this session.</div>
        ) : (
          session.messages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.isMe 
                  ? 'rounded-br-sm bg-white text-[#1A362B] shadow-sm border border-[#1A362B]/5' 
                  : 'rounded-bl-sm bg-[#A3C4AC]/20 text-[#1A362B]'
              }`}>
                <p className="font-sans text-[15px] leading-relaxed">{msg.translatedText}</p>
                {!msg.isMe && msg.originalText !== msg.translatedText && (
                  <p className="mt-2 border-t border-[#1A362B]/10 pt-1 text-[11px] italic opacity-70">
                    {msg.originalText}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer Banner */}
      <div className="bg-[#FDF3EB] p-3 text-center border-t border-[#1A362B]/10 text-xs font-medium text-[#1A362B]/60 sticky bottom-0">
        This is a read-only view of a past conversation.
      </div>
    </div>
  );
}
