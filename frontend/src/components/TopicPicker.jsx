import React, { useState } from 'react';

const PREDEFINED_TOPICS = [
  "Exam Stress",
  "Loneliness",
  "Family Issues",
  "Relationship Advice",
  "Career Anxiety"
];

export default function TopicPicker({ onProceed }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [language, setLanguage] = useState('en');

  const handleProceed = () => {
    const finalTopic = customTopic.trim() ? customTopic : selectedTopic;
    if (!finalTopic) return;
    onProceed({ topic: finalTopic, emergencyContact: emergencyContact.trim(), language });
  };

  return (
    <div className="p-6 flex flex-col h-full bg-primary text-textLight overflow-y-auto">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-2">What do you want to talk about?</h2>
        <p className="text-textMuted mb-6 text-sm leading-relaxed">
          Select a topic or type your own. You are completely anonymous.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          {PREDEFINED_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => {
                setSelectedTopic(topic);
                setCustomTopic('');
              }}
              className={`px-4 py-3 rounded-full border transition-all text-sm font-medium ${
                selectedTopic === topic && !customTopic
                  ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'border-secondary bg-secondary text-textMuted hover:border-accentHover hover:text-textLight'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-textMuted mb-2">
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
            className="w-full bg-secondary border border-slate-700 rounded-xl px-5 py-4 text-textLight focus:outline-none focus:border-accent transition-colors shadow-inner placeholder:text-slate-600"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-textMuted mb-2 flex items-center justify-between">
            <span>Emergency Contact Number:</span>
            <span className="text-xs text-slate-500 font-normal border border-slate-700 px-2 py-0.5 rounded-md">Optional</span>
          </label>
          <input
            type="tel"
            placeholder="e.g., +1 555-0123"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full bg-secondary border border-slate-700 rounded-xl px-5 py-4 text-textLight focus:outline-none focus:border-accent transition-colors shadow-inner placeholder:text-slate-600"
          />
          <p className="text-xs text-slate-500 mt-2">Saved securely in our database in case of a mental health emergency.</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-textMuted mb-2">
            My Preferred Language:
          </label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-secondary border border-slate-700 rounded-xl px-5 py-4 text-textLight focus:outline-none focus:border-accent shadow-inner appearance-none"
          >
            <option value="en">English</option>
            <option value="te">Telugu</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>

      </div>
      
      <button 
        disabled={!selectedTopic && !customTopic.trim()}
        onClick={handleProceed}
        className="w-full py-4 bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg hover:bg-accentHover active:scale-[0.98] transition-all"
      >
        Find a Peer
      </button>
    </div>
  );
}
