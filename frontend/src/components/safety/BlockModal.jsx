import React from 'react';
import { Ban, ArrowRight, ShieldCheck } from 'lucide-react';

export default function BlockModal({ onReturnToDashboard }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 text-center text-[#f6f2e9] border border-[#e8795d]/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e8795d]/15 text-[#e8795d] border border-[#e8795d]/30">
          <Ban size={28} />
        </div>

        <h3 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[#f6f2e9] mb-3">
          Person Blocked
        </h3>

        <p className="text-sm leading-relaxed text-[#b7c5b4] mb-2 font-medium">
          This person has been blocked.
        </p>

        <p className="text-xs text-[#70817a] mb-8 leading-relaxed">
          They will no longer be able to start or recommend a conversation with you in future matchmaking sessions.
        </p>

        <button
          onClick={onReturnToDashboard}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e8795d] hover:bg-[#f28e73] text-[#101a1a] py-4 font-bold transition-all shadow-[0_8px_20px_rgba(232,121,93,0.25)] hover:-translate-y-0.5 active:scale-98"
        >
          Return to Dashboard <ArrowRight size={18} />
        </button>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#70817a]">
          <ShieldCheck size={13} className="text-[#91bb8e]" />
          Block permanently enforced across matching queue
        </p>
      </div>
    </div>
  );
}
