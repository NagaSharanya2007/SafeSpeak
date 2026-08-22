import React from 'react';
import { ArrowLeft, Loader2, Radio } from 'lucide-react';

export default function WaitingScreen({ onCancel }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center p-6 text-[#f6f2e9]">
      
      {/* Soft Pulsing Circle */}
      <div className="relative mb-12 mt-10 flex h-52 w-52 items-center justify-center reveal">
        <div className="absolute inset-0 rounded-full border border-[#91bb8e]/20 animate-ping" />
        <div className="absolute inset-7 rounded-full border border-dashed border-[#e8795d]/40 animate-[spin_12s_linear_infinite]" />
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[#91bb8e] text-[#101a1a] shadow-[0_0_55px_rgba(145,187,142,.35)]">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.25em] text-[#e8795d] reveal reveal-delay-1"><Radio size={13} /> Signal searching</div>
      <h2 className="font-['Space_Grotesk'] mb-5 text-center text-4xl font-semibold tracking-[-.05em] sm:text-6xl reveal reveal-delay-1">
        Finding your person.
      </h2>
      <p className="mb-12 max-w-md text-center leading-7 text-[#b7c5b4] reveal reveal-delay-2">
        Looking for a peer who understands your topic and language. Your room will open as soon as the match is ready.
      </p>

      <button 
        onClick={onCancel}
        className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-[#b7c5b4] transition hover:border-[#e8795d] hover:text-[#f6f2e9] reveal reveal-delay-3"
      >
        <ArrowLeft size={16} /> Cancel search
      </button>
    </div>
  );
}
