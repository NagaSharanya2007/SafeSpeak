import React from 'react';
import { Phone, Shield, X, Heart, ExternalLink } from 'lucide-react';

const HELPLINES = [
  {
    name: "Tele-MANAS (India Govt Helpline)",
    number: "14416",
    dialNumber: "14416",
    desc: "24/7 Free National Tele-Mental Health Programme (Multi-lingual)"
  },
  {
    name: "KIRAN Mental Health Helpline",
    number: "1800-599-0019",
    dialNumber: "18005990019",
    desc: "24/7 Toll-free mental health rehabilitation helpline"
  },
  {
    name: "Vandrevala Foundation Helpline",
    number: "+91 9999 666 555",
    dialNumber: "+919999666555",
    desc: "24/7 Free professional counseling & crisis intervention"
  },
  {
    name: "AASRA Helpline",
    number: "+91 98204 66726",
    dialNumber: "+919820466726",
    desc: "24/7 Confidential crisis support and suicide prevention"
  },
  {
    name: "Suicide & Crisis Lifeline (US/Intl)",
    number: "988",
    dialNumber: "988",
    desc: "24/7 Free & confidential support across North America"
  }
];

export default function CrisisHelpModal({ onClose, onTriggerEmergencyAlert }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 text-[#f6f2e9] border border-[#e8795d]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#b7c5b4] transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8795d]/20 text-[#e8795d] border border-[#e8795d]/40">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#f6f2e9]">Immediate Help & Helplines</h3>
            <p className="text-xs text-[#91bb8e]">Free, confidential 24/7 crisis support</p>
          </div>
        </div>

        <p className="text-xs text-[#b7c5b4] mb-6 leading-relaxed">
          If you or someone you know is going through a tough time, please reach out. Compassionate professionals are ready to listen without judgment.
        </p>

        {/* Helplines List */}
        <div className="space-y-3 mb-6">
          {HELPLINES.map((line, idx) => (
            <a
              key={idx}
              href={`tel:${line.dialNumber}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#91bb8e]/50 transition-all group"
            >
              <div>
                <p className="text-sm font-bold text-[#f6f2e9] group-hover:text-[#91bb8e] transition">
                  {line.name}
                </p>
                <p className="text-xs text-[#70817a]">{line.desc}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#91bb8e]/15 px-3 py-2 text-xs font-mono font-bold text-[#91bb8e] border border-[#91bb8e]/30">
                <Phone size={13} />
                <span>{line.number}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-white/10 hover:bg-white/15 py-3.5 text-xs font-bold text-[#f6f2e9] transition"
        >
          Close and Return
        </button>

      </div>
    </div>
  );
}
