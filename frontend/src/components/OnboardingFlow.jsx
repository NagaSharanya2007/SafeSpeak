import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';

export default function OnboardingFlow({ onProceed }) {
  const [step, setStep] = useState(1);
  const [context, setContext] = useState('');
  const [mood, setMood] = useState('');
  const [interest, setInterest] = useState('');
  const [language, setLanguage] = useState('en'); // Default to en, matching previous logic

  const contextOptions = ["Placements & Exams", "Loneliness", "Family Pressure", "General Anxiety"];
  
  const moodOptions = [
    { label: "Heavy / Need to Vent", value: "seeker" },
    { label: "In the Middle", value: "neutral" },
    { label: "Grounded / Ready to Listen", value: "anchor" }
  ];

  const interestOptions = ["Gaming", "Music", "Coding", "Art", "Movies"];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConnect = () => {
    onProceed({ context, mood, interest, language });
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 text-[#f6f2e9]">
      <div className="flex w-full max-w-2xl flex-col bg-white/[.03] p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 font-mono text-[10px] uppercase tracking-[.25em] text-[#e8795d]">
          <span className={step >= 1 ? "text-[#F28C69]" : "text-white/30"}>01 Context</span>
          <span className="text-white/20">-</span>
          <span className={step >= 2 ? "text-[#F28C69]" : "text-white/30"}>02 Mood</span>
          <span className="text-white/20">-</span>
          <span className={step >= 3 ? "text-[#F28C69]" : "text-white/30"}>03 Interest</span>
        </div>

        {/* STEP 1: CONTEXT */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-3 text-[#f6f2e9]">What is your main focus today?</h2>
            <p className="text-[#A3C4AC] mb-8">This helps us align you with someone going through similar things.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contextOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setContext(opt);
                    setTimeout(handleNext, 300);
                  }}
                  className={`p-5 rounded-2xl border text-left font-sans font-medium transition-all ${
                    context === opt
                      ? 'bg-[#F28C69] border-[#F28C69] text-[#101a1a] shadow-[0_5px_15px_rgba(242,140,105,.2)]'
                      : 'bg-white/5 border-white/10 text-[#e8f0ea] hover:bg-white/10 hover:border-[#F28C69]/50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: MOOD */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-3 text-[#f6f2e9]">Where is your headspace right now?</h2>
            <p className="text-[#A3C4AC] mb-8">We use this to create balanced conversations where both sides feel heard.</p>
            
            <div className="flex flex-col gap-4">
              {moodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setMood(opt.value);
                    setTimeout(handleNext, 300);
                  }}
                  className={`p-5 rounded-2xl border text-left font-sans font-medium transition-all ${
                    mood === opt.value
                      ? 'bg-[#A3C4AC] border-[#A3C4AC] text-[#101a1a] shadow-[0_5px_15px_rgba(163,196,172,.2)]'
                      : 'bg-white/5 border-white/10 text-[#e8f0ea] hover:bg-white/10 hover:border-[#A3C4AC]/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: INTEREST */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-3 text-[#f6f2e9]">Pick a grounding interest.</h2>
            <p className="text-[#A3C4AC] mb-8">A simple icebreaker to help you start chatting naturally.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setInterest(opt)}
                  className={`p-4 rounded-2xl border text-center font-sans font-medium transition-all ${
                    interest === opt
                      ? 'bg-[#F28C69] border-[#F28C69] text-[#101a1a] shadow-[0_5px_15px_rgba(242,140,105,.2)]'
                      : 'bg-white/5 border-white/10 text-[#e8f0ea] hover:bg-white/10 hover:border-[#F28C69]/50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="mb-8 text-left">
              <label className="mb-3 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#A3C4AC]">
                I prefer to type in:
              </label>
              <div className="relative">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-medium text-[#f6f2e9] outline-none transition focus:border-[#F28C69]"
                >
                  <option value="en" className="bg-[#101a1a] text-white">English</option>
                  <option value="hi" className="bg-[#101a1a] text-white">Hindi</option>
                  <option value="te" className="bg-[#101a1a] text-white">Telugu</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-[#A3C4AC]">
                  <ChevronDown size={17} />
                </div>
              </div>
            </div>

            <button 
              disabled={!interest}
              onClick={handleConnect}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#A3C4AC] py-5 font-bold text-[#101a1a] shadow-[0_10px_30px_rgba(163,196,172,.2)] transition-all hover:-translate-y-1 hover:bg-[#8eb899] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Connect Now <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between">
          {step > 1 ? (
            <button 
              onClick={handleBack} 
              className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div></div>}
        </div>

      </div>
    </div>
  );
}
