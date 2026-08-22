import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, MessageSquare, PhoneCall, AlertTriangle } from 'lucide-react';

export default function SuicideRiskAlert({ 
  riskLevel = 'HIGH_IMMINENT', 
  dispatchStatus = 'SENT', // 'SENT' | 'ALREADY_SENT' | 'FAILED' | 'NOT_CONFIGURED'
  dispatchError = null,
  hasEmergencyContact = false,
  onOpenCopilot, 
  onOpenCrisisHelp, 
  onDismiss 
}) {
  const isSent = dispatchStatus === 'SENT' || dispatchStatus === 'ALREADY_SENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center text-[#f6f2e9] border border-[#e8795d]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        
        {/* Top Status Icon */}
        <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border ${
          isSent 
            ? 'bg-[#91bb8e]/20 text-[#91bb8e] border-[#91bb8e]/40'
            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
        }`}>
          {isSent ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
        </div>

        {/* Title */}
        <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight text-[#f6f2e9] mb-3">
          {isSent 
            ? "🛡️ Emergency support has been contacted." 
            : "⚠️ We couldn't reach your emergency contact automatically."}
        </h3>

        {/* Message Body */}
        <p className="text-sm leading-relaxed text-[#b7c5b4] mb-6">
          {isSent 
            ? "Your registered emergency contact has been notified because we detected signs that you may need immediate support."
            : (dispatchError || "We detected signs that you may need immediate support, but automatic carrier SMS was unavailable. Please reach out to someone you trust or 24/7 crisis support.")}
        </p>

        {/* Status Confirmation Card */}
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#b7c5b4] font-bold">
              Automatic Safety Protocol
            </span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
              isSent 
                ? 'bg-[#91bb8e]/20 text-[#91bb8e] border border-[#91bb8e]/40' 
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
            }`}>
              {isSent ? 'SMS Dispatched' : 'Direct Helpline Recommended'}
            </span>
          </div>

          <p className="text-xs text-[#d7e0d5] leading-relaxed">
            {isSent 
              ? "A safety alert was transmitted to your registered emergency contact without sharing private messages."
              : "Free, confidential 24/7 helplines and your Empathy Copilot are available to support you right now."}
          </p>
        </div>

        {/* Interactive Supportive Options */}
        <div className="flex flex-col gap-3">
          {/* 1. Talk to Empathy Copilot */}
          <button
            onClick={onOpenCopilot}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#91bb8e] hover:bg-[#a3c4ac] text-[#101a1a] py-4 font-bold transition-all shadow-[0_8px_20px_rgba(145,187,142,0.25)] hover:-translate-y-0.5 active:scale-98"
          >
            <Sparkles size={18} />
            Talk to Empathy Copilot
          </button>

          {/* 2. Get immediate help (24/7 Helplines) */}
          <button
            onClick={onOpenCrisisHelp}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 py-3.5 font-semibold text-[#f6f2e9] transition-all hover:-translate-y-0.5 active:scale-98 text-sm"
          >
            <PhoneCall size={16} className="text-[#e8795d]" />
            Get immediate help
          </button>

          {/* 3. Keep talking */}
          <button
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-transparent hover:bg-white/5 py-3 text-xs font-semibold text-[#70817a] hover:text-[#b7c5b4] transition-all"
          >
            <MessageSquare size={15} />
            Keep talking
          </button>
        </div>

      </div>
    </div>
  );
}
