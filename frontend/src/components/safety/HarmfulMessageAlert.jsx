import React from 'react';
import { AlertTriangle, Eye, LogOut, Ban, ShieldCheck } from 'lucide-react';

export default function HarmfulMessageAlert({ onShowMessage, onDisconnect, onBlock }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center text-[#f6f2e9] border border-[#e8795d]/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        {/* Header Icon */}
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#e8795d]/15 text-[#e8795d] border border-[#e8795d]/30">
          <AlertTriangle size={32} />
        </div>

        {/* Title */}
        <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight text-[#f6f2e9] mb-3">
          Harmful content detected
        </h3>

        {/* Reassuring Body Text */}
        <p className="text-sm leading-relaxed text-[#b7c5b4] mb-2">
          The person you're chatting with may have sent harmful or inappropriate content.
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#91bb8e] mb-8">
          You’re in control of what you see next.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* 1. Show Message */}
          <button
            onClick={onShowMessage}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 py-4 font-semibold text-[#f6f2e9] transition-all hover:-translate-y-0.5 active:scale-98"
          >
            <Eye size={18} className="text-[#91bb8e]" />
            Show Message
          </button>

          {/* 2. Disconnect for now (Temporary) */}
          <button
            onClick={onDisconnect}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/5 hover:bg-[#e8795d]/20 border border-white/10 hover:border-[#e8795d]/40 py-4 font-semibold text-[#e8f0ea] transition-all hover:-translate-y-0.5 active:scale-98"
          >
            <LogOut size={18} className="text-[#e8795d]" />
            Disconnect for now
          </button>

          {/* 3. Block (Permanent) */}
          <button
            onClick={onBlock}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e8795d] hover:bg-[#f28e73] text-[#101a1a] py-4 font-bold transition-all shadow-[0_8px_20px_rgba(232,121,93,0.25)] hover:-translate-y-0.5 active:scale-98"
          >
            <Ban size={18} />
            Block
          </button>
        </div>

        {/* Subtle reassurance footer */}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#70817a]">
          <ShieldCheck size={13} className="text-[#91bb8e]" />
          SafeSpeak privacy and anti-bullying shield active
        </p>
      </div>
    </div>
  );
}
