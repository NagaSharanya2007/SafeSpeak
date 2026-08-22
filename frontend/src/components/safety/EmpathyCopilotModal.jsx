import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../socket';
import { Sparkles, Heart, Wind, ArrowRight, X, Send, Bot, ShieldAlert } from 'lucide-react';

export default function EmpathyCopilotModal({ onClose, onOpenCrisisHelp }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [breathePhase, setBreathePhase] = useState('Inhale');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Multi-turn interactive conversation state with Empathy Copilot
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'copilot',
      text: "I'm here with you. I'm really sorry you're carrying this much right now. You don't have to figure everything out at once. Can we stay here together for a moment and talk about what's making things feel so overwhelming?"
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (activeTab !== 'breathe') return;
    const interval = setInterval(() => {
      setBreathePhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const updatedHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(updatedHistory);
    setInputText('');
    setIsTyping(true);

    // Call Real Backend Google AI Endpoint
    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: updatedHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          setChatMessages((prev) => [...prev, { sender: 'copilot', text: data.text }]);
          setIsTyping(false);
          return;
        }
      }
      throw new Error("HTTP API fallback needed");
    } catch (err) {
      // Socket fallback to backend
      socket.emit('copilot_chat', { message: userText, history: updatedHistory }, (res) => {
        if (res && res.text) {
          setChatMessages((prev) => [...prev, { sender: 'copilot', text: res.text }]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            { sender: 'copilot', text: "I hear you, and I'm right here with you. Take a slow, deep breath. What feels most difficult right now?" }
          ]);
        }
        setIsTyping(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101a1a]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-7 text-[#f6f2e9] border border-[#91bb8e]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative flex flex-col max-h-[92vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#b7c5b4] transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#91bb8e]/20 text-[#91bb8e] border border-[#91bb8e]/40">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#f6f2e9]">Empathy Copilot</h3>
            <p className="text-xs text-[#91bb8e]">AI supportive companion for grounding & listening</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-4 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'chat' ? 'bg-[#91bb8e] text-[#101a1a]' : 'text-[#b7c5b4] hover:text-white'
            }`}
          >
            AI Supportive Chat
          </button>
          <button
            onClick={() => setActiveTab('breathe')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'breathe' ? 'bg-[#91bb8e] text-[#101a1a]' : 'text-[#b7c5b4] hover:text-white'
            }`}
          >
            Box Breathing
          </button>
          <button
            onClick={() => setActiveTab('grounding')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'grounding' ? 'bg-[#91bb8e] text-[#101a1a]' : 'text-[#b7c5b4] hover:text-white'
            }`}
          >
            Grounding
          </button>
          <button
            onClick={() => setActiveTab('affirm')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'affirm' ? 'bg-[#91bb8e] text-[#101a1a]' : 'text-[#b7c5b4] hover:text-white'
            }`}
          >
            Affirmation
          </button>
        </div>

        {/* 1. SUPPORTIVE LIVE CHAT WITH GOOGLE AI COPILOT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-[260px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-black/20 border border-white/5 mb-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'copilot' && (
                    <div className="h-7 w-7 rounded-lg bg-[#91bb8e]/20 text-[#91bb8e] grid place-items-center shrink-0 mt-1">
                      <Bot size={15} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#e8795d] text-[#101a1a] font-medium'
                      : 'bg-white/10 text-[#f6f2e9] border border-white/10'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#91bb8e] italic pl-2">
                  <span className="h-2 w-2 rounded-full bg-[#91bb8e] animate-ping" />
                  Empathy Copilot is reflecting...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Talk to Empathy Copilot..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-[#f6f2e9] outline-none focus:border-[#91bb8e] placeholder:text-[#70817a]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="rounded-xl bg-[#91bb8e] hover:bg-[#a3c4ac] text-[#101a1a] px-4 py-2.5 font-bold transition disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* 2. BOX BREATHING */}
        {activeTab === 'breathe' && (
          <div className="py-6 text-center flex-1 flex flex-col items-center justify-center">
            <div className="relative mx-auto mb-6 flex h-36 w-36 items-center justify-center">
              <div className={`absolute inset-0 rounded-full border-2 border-[#91bb8e]/40 transition-all duration-1000 ${
                breathePhase === 'Inhale' ? 'scale-125 bg-[#91bb8e]/15' : breathePhase === 'Hold' ? 'scale-110 bg-[#91bb8e]/10' : 'scale-90 bg-transparent'
              }`} />
              <div className="relative text-center">
                <Wind className="mx-auto mb-2 text-[#91bb8e]" size={28} />
                <p className="font-['Space_Grotesk'] text-lg font-bold text-[#f6f2e9]">{breathePhase}</p>
                <p className="text-[10px] text-[#70817a] font-mono">4 seconds</p>
              </div>
            </div>
            <p className="text-xs text-[#b7c5b4] max-w-xs mx-auto">
              Follow the rhythm. Inhale slowly, hold gently, and exhale all tension.
            </p>
          </div>
        )}

        {/* 3. 5-4-3-2-1 GROUNDING */}
        {activeTab === 'grounding' && (
          <div className="space-y-2.5 py-2 text-left text-xs text-[#b7c5b4] flex-1 overflow-y-auto">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#e8795d]/20 text-[#e8795d] font-bold">5</span>
              <span>Look for <strong>5 things</strong> you can see right now around you.</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[#91bb8e]/20 text-[#91bb8e] font-bold">4</span>
              <span>Notice <strong>4 things</strong> you can physically touch or feel.</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-400/20 text-amber-400 font-bold">3</span>
              <span>Listen for <strong>3 sounds</strong> in your environment.</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-sky-400/20 text-sky-400 font-bold">2</span>
              <span>Identify <strong>2 scents</strong> or smells you notice.</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-400/20 text-emerald-400 font-bold">1</span>
              <span>Say <strong>1 kind thing</strong> to yourself right now.</span>
            </div>
          </div>
        )}

        {/* 4. AFFIRMATIONS */}
        {activeTab === 'affirm' && (
          <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
            <Heart className="mx-auto mb-4 text-[#e8795d]" size={36} />
            <blockquote className="font-['Space_Grotesk'] text-xl font-medium text-[#f6f2e9] mb-4">
              “This heavy feeling will not last forever. You are worthy of peace, patience, and support.”
            </blockquote>
            <p className="text-xs text-[#70817a]">Take a deep breath and give yourself grace.</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onOpenCrisisHelp}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#e8795d] hover:text-[#f28e73] transition"
          >
            <ShieldAlert size={14} /> 24/7 Crisis Helplines
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-[#91bb8e] px-4 py-2 text-xs font-bold text-[#101a1a] transition hover:bg-[#a3c4ac]"
          >
            Return to Chat <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
