import React from 'react';
import { Loader2 } from 'lucide-react';

export default function WaitingScreen({ onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-primary">
      <div className="relative flex items-center justify-center w-32 h-32 mb-10">
        <div className="absolute w-full h-full border-[4px] border-accent rounded-full animate-ping opacity-60"></div>
        <div className="absolute w-24 h-24 border-[4px] border-accentHover rounded-full animate-pulse opacity-80"></div>
        <Loader2 className="animate-spin text-accent relative z-10" size={44} />
      </div>
      
      <h2 className="text-2xl font-bold mb-3 text-textLight tracking-wide">Finding a partner...</h2>
      
      <p className="text-textMuted text-center max-w-[280px] mb-12 leading-relaxed">
        Searching for someone who wants to discuss similar topics. 
        <br/><br/>
        <span className="text-xs text-accent opacity-80 font-medium">
          If we can't find an exact match in 15 seconds, we'll connect you with a general peer.
        </span>
      </p>

      <button 
        onClick={onCancel}
        className="text-textMuted hover:text-white transition-colors underline underline-offset-4 text-sm mt-auto"
      >
        Cancel Search
      </button>
    </div>
  );
}
