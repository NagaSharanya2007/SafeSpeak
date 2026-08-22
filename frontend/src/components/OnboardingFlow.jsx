import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ChevronDown, User, Phone, LockKeyhole, Mail, Database } from 'lucide-react';
import ResearcherDashboard from './ResearcherDashboard';

const generateUUID = () => {
  return 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

const generateAlias = () => {
  const adjectives = ["Silent", "Warm", "Wandering", "Gentle", "Quiet", "Calm", "Breezy", "Soft", "Misty", "Autumn"];
  const nouns = ["Pine", "Ember", "Cloud", "Leaf", "River", "Meadow", "Breeze", "Rain", "Dawn", "Willow"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};

export default function OnboardingFlow({ onProceed }) {
  const [step, setStep] = useState(-1); // -1: Loading, 1: Context, 2: Mood, 3: Interest
  const [profile, setProfile] = useState(null);
  
  const [context, setContext] = useState('');
  const [mood, setMood] = useState('');
  const [interest, setInterest] = useState('');
  const [language, setLanguage] = useState('en');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [viewMode, setViewMode] = useState('support'); // 'support', 'researcher_login', 'dashboard'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [researchError, setResearchError] = useState('');

  const contextOptions = ["Placements & Exams", "Loneliness", "Family Pressure", "General Anxiety"];
  
  const moodOptions = [
    { label: "Heavy / Need to Vent", value: "seeker" },
    { label: "In the Middle", value: "neutral" },
    { label: "Grounded / Ready to Listen", value: "anchor" }
  ];

  const interestOptions = ["Gaming", "Music", "Coding", "Art", "Movies"];

  useEffect(() => {
    const savedProfile = localStorage.getItem('safeSpeak_user_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
    }
    setStep(1);
  }, []);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConnect = () => {
    onProceed({ 
      context, 
      mood, 
      interest, 
      language,
      emergencyContact,
      userId: profile?.userId,
      alias: profile?.alias
    });
  };


  const handleResearchLogin = async (e) => {
    e.preventDefault();
    setResearchError('');
    try {
      const res = await fetch('http://localhost:3000/api/research/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setViewMode('dashboard');
      } else {
        setResearchError(data.error || 'Login failed');
      }
    } catch (err) {
      setResearchError('Network error');
    }
  };

  if (step === -1) return null; // Loading state

  return (

    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 text-[#f6f2e9]">
      <div className="flex w-full max-w-2xl flex-col bg-white/[.03] p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm">
        
        {/* Toggle */}
        {viewMode !== 'dashboard' && (
          <div className="mb-8 flex self-center rounded-full bg-white/5 p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('support')}
              className={`rounded-full px-6 py-2 text-sm font-bold transition ${viewMode === 'support' ? 'bg-[#e8795d] text-[#101a1a]' : 'text-white/50 hover:text-white'}`}
            >
              Seek Support
            </button>
            <button 
              onClick={() => setViewMode('researcher_login')}
              className={`rounded-full px-6 py-2 text-sm font-bold transition ${viewMode === 'researcher_login' ? 'bg-[#e8795d] text-[#101a1a]' : 'text-white/50 hover:text-white'}`}
            >
              Researcher Portal
            </button>
          </div>
        )}

        {viewMode === 'dashboard' ? (
          <ResearcherDashboard />
        ) : viewMode === 'researcher_login' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md mx-auto text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#e8795d]/20 text-[#e8795d]">
              <Database size={28} />
            </div>
            <h2 className="font-playfair text-3xl font-bold mb-2">Researcher Access</h2>
            <p className="text-[#A3C4AC] mb-8 text-sm">Secure access to synthetic, anonymized dataset.</p>
            
            <form onSubmit={handleResearchLogin} className="flex flex-col gap-4 text-left">
              {researchError && <div className="text-red-400 text-sm">{researchError}</div>}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50"><Mail size={16} /></div>
                <input type="email" required placeholder="Institutional Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm text-[#f6f2e9] outline-none transition focus:border-[#e8795d]" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50"><LockKeyhole size={16} /></div>
                <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm text-[#f6f2e9] outline-none transition focus:border-[#e8795d]" />
              </div>
              <button type="submit" className="mt-4 w-full rounded-2xl bg-[#e8795d] py-3.5 font-bold text-[#101a1a] shadow-[0_10px_30px_rgba(232,121,93,.2)] transition hover:-translate-y-1 hover:bg-[#f28e73]">
                Access Database
              </button>
            </form>
          </div>
        ) : (
          <>
        {/* Welcome Back Toast for returning users */}
        {profile && step === 1 && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-[#A3C4AC]/10 p-3 text-sm font-medium text-[#A3C4AC] border border-[#A3C4AC]/20 animate-in fade-in slide-in-from-top-2">
            <User size={16} /> Welcome back, {profile.alias}.
          </div>
        )}

        {/* Step Indicator (Only show for steps 1-3) */}
        {step >= 1 && (
          <div className="flex items-center gap-2 mb-8 font-mono text-[10px] uppercase tracking-[.25em] text-[#e8795d]">
            <span className={step >= 1 ? "text-[#F28C69]" : "text-white/30"}>01 Context</span>
            <span className="text-white/20">-</span>
            <span className={step >= 2 ? "text-[#F28C69]" : "text-white/30"}>02 Mood</span>
            <span className="text-white/20">-</span>
            <span className={step >= 3 ? "text-[#F28C69]" : "text-white/30"}>03 Interest</span>
          </div>
        )}



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

            <div className="mb-6 text-left">
              <label className="mb-3 ml-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#A3C4AC]">
                <span>Emergency Contact Phone Number:</span>
                <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] font-normal tracking-normal text-[#70817a]">Optional</span>
              </label>
              <input
                type="tel"
                placeholder="e.g., +91 9876543210"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-medium text-[#f6f2e9] outline-none transition focus:border-[#F28C69] placeholder:text-[#70817a]"
              />
              <p className="ml-1 mt-2 flex items-center gap-1 text-xs text-[#70817a]"><LockKeyhole size={12} /> Dispatches instant SMS safety alert to registered phone if acute crisis is detected.</p>
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
        {step >= 1 && (
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
        )}

          </>
        )}

      </div>
    </div>
  );
}
