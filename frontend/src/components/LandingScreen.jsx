import React from 'react';
import { ArrowUpRight, Globe2, HeartHandshake, LockKeyhole, Sparkles, Users } from 'lucide-react';

export default function LandingScreen({ onStart, onAbout, onHistory }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-5 py-10 text-center text-[#f6f2e9]">
      <div className="w-full max-w-5xl">
        <div className="mb-10 flex items-center justify-between text-left reveal">
          <div className="flex items-center gap-3 font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8795d] text-[#101a1a]"><HeartHandshake size={18} /></span> SafeSpeak</div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#b7c5b4] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#91bb8e]" /> Private by design</div>
        </div>
        <div className="grid items-center gap-12 text-left md:grid-cols-[1.25fr_.75fr] md:gap-20">
          <div>
            <div className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.25em] text-[#e8795d] reveal reveal-delay-1"><Sparkles size={13} /> A softer kind of network</div>
            <h1 className="font-['Space_Grotesk'] text-5xl font-semibold leading-[.96] tracking-[-.06em] text-[#f6f2e9] sm:text-7xl md:text-8xl reveal reveal-delay-1">
              Speak the<br /><span className="text-[#e8795d]">unspoken.</span>
          </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#b7c5b4] reveal reveal-delay-2">A private room to find a real peer, in your language, at the exact moment you need to be heard.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4 reveal reveal-delay-3">
              <button onClick={onStart} className="group inline-flex items-center gap-4 rounded-full bg-[#e8795d] px-6 py-4 font-semibold text-[#101a1a] shadow-[0_12px_30px_rgba(232,121,93,.2)] transition hover:-translate-y-1 hover:bg-[#f28e73]">Enter SafeSpeak <span className="grid h-8 w-8 place-items-center rounded-full bg-[#101a1a] text-[#f6f2e9] transition group-hover:rotate-45"><ArrowUpRight size={16} /></span></button>
              <button onClick={onAbout} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-4 font-semibold text-[#f6f2e9] transition hover:bg-white/5 hover:border-white/20">About SafeSpeak</button>
            </div>
          </div>
          <div className="glass-panel relative mx-auto aspect-square w-full max-w-[300px] rounded-[2rem] p-6 reveal reveal-delay-2 sm:max-w-[360px]">
            <div className="absolute inset-7 rounded-full border border-[#91bb8e]/30" /><div className="absolute inset-14 rounded-full border border-dashed border-[#e8795d]/40" />
            <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#91bb8e] text-[#101a1a] shadow-[0_0_55px_rgba(145,187,142,.35)]"><Globe2 size={38} strokeWidth={1.5} /></div>
            <div className="absolute left-8 top-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-[#b7c5b4]"><LockKeyhole size={13} className="mb-1 text-[#e8795d]" /> Private</div>
            <div className="absolute bottom-10 right-7 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-[#b7c5b4]"><Users size={13} className="mb-1 text-[#91bb8e]" /> Human</div>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#70817a] reveal reveal-delay-3"><span>01 / Anonymous</span><span>02 / Human-led</span><span>03 / Live translation</span></div>
      </div>
    </div>
  );
}
