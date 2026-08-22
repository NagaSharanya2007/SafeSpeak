import React from 'react';
import { LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DisconnectModal({ onReturnToDashboard }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 text-center text-[#f6f2e9] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#91bb8e] border border-white/15">
          <LogOut size={28} />
        </div>

        <h3 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[#f6f2e9] mb-3">
          Disconnected
        </h3>

        <p className="text-sm leading-relaxed text-[#b7c5b4] mb-2">
          You’ve disconnected from this conversation for now.
        </p>

        <p className="text-xs text-[#70817a] mb-8">
          This was a temporary disconnect. You can find a new peer whenever you're ready.
        </p>

        <button
          onClick={onReturnToDashboard}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#91bb8e] hover:bg-[#a3c4ac] text-[#101a1a] py-4 font-bold transition-all shadow-[0_8px_20px_rgba(145,187,142,0.25)] hover:-translate-y-0.5 active:scale-98"
        >
          Return to Dashboard <ArrowRight size={18} />
        </button>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#70817a]">
          <ShieldCheck size={13} className="text-[#91bb8e]" />
          SafeSpeak safe session closed
        </p>
      </div>
    </div>
  );
}
