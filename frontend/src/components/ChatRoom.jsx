import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { 
  CheckCheck, 
  Globe2, 
  LockKeyhole, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  Eye, 
  LogOut, 
  Ban, 
  PhoneCall, 
  HeartHandshake 
} from 'lucide-react';

import HarmfulMessageAlert from './safety/HarmfulMessageAlert';
import SenderWarningModal from './safety/SenderWarningModal';
import SuicideRiskAlert from './safety/SuicideRiskAlert';
import EmpathyCopilotModal from './safety/EmpathyCopilotModal';
import CrisisHelpModal from './safety/CrisisHelpModal';
import DisconnectModal from './safety/DisconnectModal';
import BlockModal from './safety/BlockModal';
import LowRiskSupportCard from './safety/LowRiskSupportCard';

export default function ChatRoom({ peerInfo, userLanguage, emergencyContact = '', messages, setMessages, onLeave }) {
  const [sessionId] = useState(() => Date.now());
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Safety & Intervention State
  const [activeHarmfulMessageId, setActiveHarmfulMessageId] = useState(null);
  const [revealedMessageIds, setRevealedMessageIds] = useState(new Set());
  const [senderWarning, setSenderWarning] = useState(null); // { warningLevel, reason }
  const [highRiskAlert, setHighRiskAlert] = useState(null); // { dispatchStatus, reason, hasEmergencyContact }
  const [showLowRiskCard, setShowLowRiskCard] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showCrisisHelp, setShowCrisisHelp] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [emergencyToast, setEmergencyToast] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Set the recognition language so it captures Hindi/Telugu correctly
      if (userLanguage === 'te') recognition.lang = 'te-IN';
      else if (userLanguage === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          socket.emit('send_message', { text: transcript.trim() });
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, [userLanguage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Could not start speech recognition", err);
      }
    }
  };

  // Language display map
  const langNames = { en: 'English', te: 'Telugu', hi: 'Hindi', hinglish: 'Hinglish' };
  const peerLangName = langNames[peerInfo?.peerLanguage] || 'Unknown';

  // Listen for socket events
  useEffect(() => {
    const handleReceive = (message) => {
      setMessages((prev) => [...prev, message]);
      
      // If harmful message received from peer, trigger receiver safety popup
      if (message.isHarmful && message.senderId !== socket.id) {
        setActiveHarmfulMessageId(message.id);
      }
    };

    const handleSenderWarning = (data) => {
      setSenderWarning({
        warningLevel: data.warningLevel || data.strikeCount || 1,
        reason: data.reason || ''
      });
    };

    const handleFlaggedIntercept = (data) => {
      setActiveHarmfulMessageId(data.messageId);
    };

    // 1. MEDIUM RISK: Empathy Copilot actively steps in and talks with user
    const handleSuicideConcern = (data) => {
      setShowCopilot(true);
    };

    // 2. HIGH RISK: Automatic escalation already triggered by backend
    const handleSuicideImminent = (data) => {
      setHighRiskAlert({
        riskLevel: 'HIGH_IMMINENT',
        reason: data.reason,
        dispatchStatus: data.dispatchStatus || (data.emergencyDispatched ? 'SENT' : 'NOT_CONFIGURED'),
        dispatchError: data.dispatchError || null,
        hasEmergencyContact: data.hasEmergencyContact || !!(emergencyContact && emergencyContact.trim())
      });
    };


    // 3. LOW RISK: Small supportive non-intrusive card
    const handleSuicideLow = (data) => {
      setShowLowRiskCard(true);
    };

    const handleEmergencyDispatched = (data) => {
      setEmergencyToast(
        data.hasContact 
          ? "Emergency notification dispatched to your registered emergency contact." 
          : "Emergency crisis alert logged. Free 24/7 helplines are available."
      );
      setTimeout(() => setEmergencyToast(null), 6000);
    };

    const handleDisconnectedSuccess = () => {
      setShowDisconnectModal(true);
    };

    const handleBlockedSuccess = () => {
      setShowBlockModal(true);
    };

    socket.on('receive_message', handleReceive);
    socket.on('sender_warning', handleSenderWarning);
    socket.on('flagged_intercept', handleFlaggedIntercept);
    socket.on('suicide_risk_concern', handleSuicideConcern);
    socket.on('suicide_risk_imminent', handleSuicideImminent);
    socket.on('suicide_risk_low', handleSuicideLow);
    socket.on('emergency_dispatched', handleEmergencyDispatched);
    socket.on('disconnected_success', handleDisconnectedSuccess);
    socket.on('blocked_success', handleBlockedSuccess);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('sender_warning', handleSenderWarning);
      socket.off('flagged_intercept', handleFlaggedIntercept);
      socket.off('suicide_risk_concern', handleSuicideConcern);
      socket.off('suicide_risk_imminent', handleSuicideImminent);
      socket.off('suicide_risk_low', handleSuicideLow);
      socket.off('emergency_dispatched', handleEmergencyDispatched);
      socket.off('disconnected_success', handleDisconnectedSuccess);
      socket.off('blocked_success', handleBlockedSuccess);
    };
  }, [setMessages, emergencyContact]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showLowRiskCard]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length === 0) return;

    try {
      const savedStr = localStorage.getItem('safespeak_history');
      let history = savedStr ? JSON.parse(savedStr) : [];
      
      const sessionIndex = history.findIndex(s => s.id === sessionId);
      const formattedMessages = messages.map(msg => ({
        ...msg,
        isMe: msg.senderId === socket.id
      }));

      if (sessionIndex >= 0) {
        history[sessionIndex].messages = formattedMessages;
      } else {
        history.push({ id: sessionId, messages: formattedMessages });
      }

      localStorage.setItem('safespeak_history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages, sessionId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    socket.emit('send_message', { text: inputText.trim() });
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const revealHarmfulMessage = (msgId) => {
    setRevealedMessageIds((prev) => new Set([...prev, msgId]));
    setActiveHarmfulMessageId(null);
  };

  const handleDisconnect = () => {
    setActiveHarmfulMessageId(null);
    socket.emit('disconnect_peer');
  };

  const handleBlock = () => {
    setActiveHarmfulMessageId(null);
    socket.emit('block_peer');
  };

  const handleReturnToDashboard = () => {
    setShowDisconnectModal(false);
    setShowBlockModal(false);
    if (onLeave) onLeave();
  };

  return (
    <div className="app-shell relative flex h-full w-full max-w-5xl flex-col text-[#f6f2e9]">
      
      {/* 1. RECEIVER HARMFUL CONTENT POPUP */}
      {activeHarmfulMessageId && (
        <HarmfulMessageAlert
          onShowMessage={() => revealHarmfulMessage(activeHarmfulMessageId)}
          onDisconnect={handleDisconnect}
          onBlock={handleBlock}
        />
      )}

      {/* 2. SENDER WARNING MODAL */}
      {senderWarning && (
        <SenderWarningModal
          warningLevel={senderWarning.warningLevel}
          onEditMessage={() => {
            setSenderWarning(null);
            inputRef.current?.focus();
          }}
          onAcknowledge={() => setSenderWarning(null)}
        />
      )}

      {/* 3. HIGH RISK SAFETY INTERVENTION MODAL (Automatic Escalation Confirmed) */}
      {highRiskAlert && (
        <SuicideRiskAlert
          riskLevel="HIGH_IMMINENT"
          dispatchStatus={highRiskAlert.dispatchStatus}
          dispatchError={highRiskAlert.dispatchError}
          hasEmergencyContact={highRiskAlert.hasEmergencyContact}
          onOpenCopilot={() => {
            setHighRiskAlert(null);
            setShowCopilot(true);
          }}
          onOpenCrisisHelp={() => {
            setHighRiskAlert(null);
            setShowCrisisHelp(true);
          }}
          onDismiss={() => setHighRiskAlert(null)}
        />
      )}


      {/* 4. EMPATHY COPILOT MODAL (Active conversation on Medium risk or manual trigger) */}
      {showCopilot && (
        <EmpathyCopilotModal
          onClose={() => setShowCopilot(false)}
          onOpenCrisisHelp={() => {
            setShowCopilot(false);
            setShowCrisisHelp(true);
          }}
        />
      )}

      {/* 5. CRISIS HELPLINES DIRECTORY MODAL */}
      {showCrisisHelp && (
        <CrisisHelpModal
          onClose={() => setShowCrisisHelp(false)}
        />
      )}

      {/* 6. DISCONNECT CONFIRMATION MODAL */}
      {showDisconnectModal && (
        <DisconnectModal onReturnToDashboard={handleReturnToDashboard} />
      )}

      {/* 7. BLOCK CONFIRMATION MODAL */}
      {showBlockModal && (
        <BlockModal onReturnToDashboard={handleReturnToDashboard} />
      )}

      {/* Emergency Notification Toast */}
      {emergencyToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-[#91bb8e] px-5 py-3 text-sm font-bold text-[#101a1a] shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <PhoneCall size={18} />
          <span>{emergencyToast}</span>
        </div>
      )}

      {/* Sticky Room Header */}
      <div className="glass-panel sticky top-0 z-10 flex items-center justify-between border-x-0 border-t-0 p-4 text-center">
        <div className="flex flex-col text-left">
          <p className="mb-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#e8795d]">
            <Sparkles size={12} />
            Topic: {peerInfo?.topic || 'General'}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-[#91bb8e]">
            <Globe2 size={12} /> Live translation from {peerLangName} <LockKeyhole size={11} className="ml-2" /> encrypted room
          </p>
        </div>

        {/* Quick Safety Actions Header Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCopilot(true)}
            title="Open Empathy Copilot"
            className="flex items-center gap-1.5 rounded-full border border-[#91bb8e]/30 bg-[#91bb8e]/10 px-3 py-1.5 text-xs font-semibold text-[#91bb8e] hover:bg-[#91bb8e]/20 transition"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Empathy Copilot</span>
          </button>

          <button
            onClick={handleDisconnect}
            title="Disconnect for now"
            className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#b7c5b4] hover:border-[#e8795d] hover:text-[#e8795d] transition"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-28 sm:px-[10%]">
        <div className="mx-auto my-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-[#70817a]">
          <CheckCheck size={13} className="text-[#91bb8e]" /> Secure room opened
        </div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === socket.id;
          const msgId = msg.id || `msg_${idx}`;
          const isHarmful = !!msg.isHarmful;
          const isRevealed = revealedMessageIds.has(msgId) || isMe;

          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 transition-all ${
                isMe 
                  ? 'rounded-br-sm bg-[#e8795d] text-[#101a1a] shadow-[0_8px_25px_rgba(232,121,93,.15)]' 
                  : isHarmful && !isRevealed
                    ? 'rounded-bl-sm border border-[#e8795d]/30 bg-[#e8795d]/10 text-[#f6f2e9]'
                    : isHarmful && isRevealed
                      ? 'rounded-bl-sm border border-[#e8795d]/40 bg-[#162423] text-[#f6f2e9]'
                      : 'glass-panel rounded-bl-sm text-[#f6f2e9]'
              }`}>
                
                {/* 1. HIDDEN HARMFUL MESSAGE PLACEHOLDER */}
                {isHarmful && !isRevealed && !isMe ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#e8795d]">
                      <AlertTriangle size={15} />
                      <span>⚠️ Harmful content detected</span>
                    </div>
                    <p className="text-xs text-[#b7c5b4]">
                      This message was flagged for potentially harmful content and hidden.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => revealHarmfulMessage(msgId)}
                        className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-[#f6f2e9] border border-white/15 transition"
                      >
                        <Eye size={13} className="text-[#91bb8e]" />
                        Show Message
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 2. REVEALED OR NORMAL MESSAGE */
                  <>
                    {/* Subtle warning label if revealed harmful content */}
                    {isHarmful && (
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#e8795d]">
                        <AlertTriangle size={13} />
                        <span>Potentially harmful content</span>
                      </div>
                    )}

                    {/* Primary Text */}
                    <p className="text-sm leading-relaxed">{msg.translatedText || msg.originalText}</p>
                    
                    {/* Original Text Subtitle if translated */}
                    {!isMe && msg.originalText && msg.translatedText && msg.originalText !== msg.translatedText && (
                      <p className="mt-2 border-t border-black/10 pt-1 text-[10px] italic opacity-70">
                        Original: {msg.originalText}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* LOW RISK SUPPORTIVE CARD: Rendered in chat flow if low risk detected */}
        {showLowRiskCard && (
          <LowRiskSupportCard
            onOpenCopilot={() => {
              setShowLowRiskCard(false);
              setShowCopilot(true);
            }}
            onOpenCrisisHelp={() => {
              setShowLowRiskCard(false);
              setShowCrisisHelp(true);
            }}
            onDismiss={() => setShowLowRiskCard(false)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Bottom Input Bar */}
      <div className="glass-panel absolute bottom-0 w-full border-x-0 border-b-0 p-4 shadow-[0_-15px_30px_rgba(0,0,0,.2)] sm:px-[10%]">
        <div className="flex gap-2">
          <button 
            onClick={toggleListening}
            title="Voice to Text (Auto Send)"
            className={`flex h-12 w-12 items-center justify-center rounded-full p-3 shadow-lg transition-all active:scale-95 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-white/10 text-[#f6f2e9] hover:bg-white/20'
            }`}
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          
          <input 
            ref={inputRef}
            type="text" 
            placeholder={isListening ? "Listening... (will send automatically)" : "Type a message..."} 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-full border border-white/10 bg-[#101a1a]/70 px-5 py-3 text-sm text-[#f6f2e9] outline-none transition focus:border-[#e8795d] placeholder:text-[#70817a]"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8795d] p-3 text-[#101a1a] shadow-lg transition-all hover:bg-[#f28e73] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={18} className={inputText.trim() ? "translate-x-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
