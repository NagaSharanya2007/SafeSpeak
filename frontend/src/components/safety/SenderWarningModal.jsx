import React from 'react';
import { AlertCircle, Edit3, CheckCircle2 } from 'lucide-react';

export default function SenderWarningModal({ warningLevel = 1, onEditMessage, onAcknowledge }) {
  let headline = "Please reconsider this message";
  let messageBody = "This message may hurt someone. Please reconsider before sending.";
  let badgeColor = "text-[#e8795d] bg-[#e8795d]/10 border-[#e8795d]/30";
  let badgeText = "First Notice";

  if (warningLevel === 2) {
    headline = "Please stop sending harmful messages";
    messageBody = "Warning: This behavior is not acceptable. Please stop sending harmful messages.";
    badgeColor = "text-amber-400 bg-amber-400/10 border-amber-400/30";
    badgeText = "Repeated Warning";
  } else if (warningLevel >= 3) {
    headline = "This is your last warning";
    messageBody = "This is your final warning. Please do not send harmful, bullying, or abusive messages.";
    badgeColor = "text-red-400 bg-red-400/15 border-red-400/40";
    badgeText = "Final Warning";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 text-center text-[#f6f2e9] border border-[#e8795d]/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        
        {/* Warning Indicator Icon */}
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e8795d]/15 text-[#e8795d] border border-[#e8795d]/30">
          <AlertCircle size={28} />
        </div>

        {/* Warning Level Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider border">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${badgeColor.split(' ')[0].replace('text-', 'bg-')}`} />
          <span className={badgeColor.split(' ')[0]}>{badgeText}</span>
        </div>

        {/* Title */}
        <h3 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[#f6f2e9] mb-3">
          {headline}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-[#b7c5b4] mb-8">
          {messageBody}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onEditMessage}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 py-3.5 font-semibold text-[#f6f2e9] transition-all hover:-translate-y-0.5 active:scale-98 text-sm"
          >
            <Edit3 size={16} className="text-[#91bb8e]" />
            Edit Message
          </button>

          <button
            onClick={onAcknowledge}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#e8795d] hover:bg-[#f28e73] text-[#101a1a] py-3.5 font-bold transition-all shadow-[0_8px_20px_rgba(232,121,93,0.2)] hover:-translate-y-0.5 active:scale-98 text-sm"
          >
            <CheckCircle2 size={16} />
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
