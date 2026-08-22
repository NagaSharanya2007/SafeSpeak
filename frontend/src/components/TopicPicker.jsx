import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, LockKeyhole } from 'lucide-react';

const PREDEFINED_TOPICS = [
  "Exam Stress",
  "Feeling Empty",
  "Family Expectations",
  "Health Anxiety"
];

export default function TopicPicker({ onProceed }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [language, setLanguage] = useState('en');

  const handleProceed = () => {
    const finalTopic = customTopic.trim() ? customTopic : selectedTopic;
    if (!finalTopic) return;
    onProceed({ topic: finalTopic, language, emergencyContact });
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 text-[#f6f2e9]">
      <div className="flex w-full max-w-3xl flex-col">
        
        <div className="mb-10 reveal">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[.25em] text-[#e8795d]">02 / Find your frequency</div>
          <h2 className="font-['Space_Grotesk'] text-4xl font-semibold tracking-[-.05em] sm:text-6xl">What’s on your mind?</h2>
          <p className="mt-4 max-w-lg text-[#b7c5b4]">Choose a starting point. You can always say more once the room opens.</p>
        </div>

        {/* Vertical List of Sage-Green Pill Buttons */}
        <div className="grid gap-3 sm:grid-cols-2 reveal reveal-delay-1">
          {PREDEFINED_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic && !customTopic;
            return (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic);
                  setCustomTopic('');
                }}
                className={`flex items-center gap-4 rounded-2xl border px-5 py-5 text-left text-sm font-semibold transition-all ${
                  isSelected
                    ? 'border-[#91bb8e] bg-[#91bb8e] text-[#101a1a] shadow-[0_10px_25px_rgba(145,187,142,.18)]'
                    : 'border-white/10 bg-white/[.04] text-[#d7e0d5] hover:-translate-y-1 hover:border-[#91bb8e]/60 hover:bg-white/[.08]'
                }`}
              >
                {/* Radio Circle */}
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
                  isSelected ? 'border-[#101a1a] bg-[#101a1a] text-[#91bb8e]' : 'border-white/20'
                }`}>
                  {isSelected && <Check size={15} />}
                </div>
                {topic}
              </button>
            );
          })}
        </div>

        <div className="mb-5 mt-8 reveal reveal-delay-2">
          <label className="mb-3 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#b7c5b4]">
            Or type a custom issue:
          </label>
          <input
            type="text"
            placeholder="e.g., Feeling lost"
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              setSelectedTopic('');
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-[#f6f2e9] outline-none transition focus:border-[#e8795d] placeholder:text-[#70817a]"
          />
        </div>

        <div className="mb-8 reveal reveal-delay-2">
          <label className="mb-3 ml-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#b7c5b4]">
            <span>Emergency Contact Phone Number:</span>
            <span className="mr-2 rounded border border-white/10 px-2 py-0.5 text-[10px] font-normal tracking-normal text-[#70817a]">Optional</span>
          </label>
          <input
            type="tel"
            placeholder="e.g., +91 9876543210"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-[#f6f2e9] outline-none transition focus:border-[#e8795d] placeholder:text-[#70817a]"
          />
          <p className="ml-1 mt-2 flex items-center gap-1 text-xs text-[#70817a]"><LockKeyhole size={12} /> Dispatches instant SMS safety alert to registered phone if acute crisis is detected.</p>
        </div>


        <div className="mb-10 reveal reveal-delay-3">
          <label className="mb-3 ml-1 block text-xs font-semibold uppercase tracking-wider text-[#b7c5b4]">
            I prefer to type in:
          </label>
          <div className="relative">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 font-medium text-[#f6f2e9] outline-none transition focus:border-[#e8795d]"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-textMuted">
              <ChevronDown size={17} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 w-full max-w-md pb-4">
        <button 
          disabled={!selectedTopic && !customTopic.trim()}
          onClick={handleProceed}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e8795d] py-4 font-semibold text-[#101a1a] shadow-[0_12px_30px_rgba(232,121,93,.2)] transition hover:-translate-y-1 hover:bg-[#f28e73] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Find a peer <ArrowRight size={18} className="transition group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
