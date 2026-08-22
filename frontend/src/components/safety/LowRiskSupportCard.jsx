import React from 'react';
import { HeartHandshake, Sparkles, MessageSquare, PhoneCall, X } from 'lucide-react';

export default function LowRiskSupportCard({ onOpenCopilot, onOpenCrisisHelp, onDismiss }) {
  return (
    <div className="mx-auto my-3 w-full max-w-xl rounded-2xl bg-[#162423]/90 border border-[#91bb8e]/30 p-4 text-[#f6f2e9] shadow-lg animate-in fade-in duration-300 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-[#70817a] hover:text-[#f6f2e9] transition p-1"
        title="Dismiss"
      >
        <X size={15} />
      </button>

      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#91bb8e]/20 text-[#91bb8e] shrink-0 mt-0.5">
          <HeartHandshake size={18} />
        </div>

        <div className="flex-1 pr-6">
          <h4 className="font-['Space_Grotesk'] text-sm font-bold text-[#f6f2e9] mb-1">
            You don't have to carry this alone.
          </h4>
          <p className="text-xs text-[#b7c5b4] leading-relaxed mb-3">
            It sounds like you're having a difficult moment. Would you like some support?
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 rounded-xl bg-[#91bb8e] px-3 py-1.5 text-xs font-bold text-[#101a1a] hover:bg-[#a3c4ac] transition"
            >
              <Sparkles size={13} />
              Talk to Empathy Copilot
            </button>

            <button
              onClick={onOpenCrisisHelp}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#f6f2e9] hover:bg-white/15 border border-white/10 transition"
            >
              <PhoneCall size={13} className="text-[#e8795d]" />
              Find someone to talk to
            </button>

            <button
              onClick={onDismiss}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#70817a] hover:text-[#b7c5b4] transition"
            >
              <MessageSquare size={13} />
              Keep talking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
