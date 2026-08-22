import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { CheckCheck, Globe2, LockKeyhole, Send, Sparkles, Mic, MicOff } from 'lucide-react';

export default function ChatRoom({ peerInfo, userLanguage, messages, setMessages }) {
  const [sessionId] = useState(() => Date.now());
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

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
          // Auto-send the transcribed text
          socket.emit('send_message', { text: transcript.trim() });
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

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
  const langNames = { en: 'English', te: 'Telugu', hinglish: 'Hinglish' };
  const peerLangName = langNames[peerInfo?.peerLanguage] || 'Unknown';

  // Listen for incoming messages
  useEffect(() => {
    const handleReceive = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    socket.on('receive_message', handleReceive);
    
    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync messages to localStorage for Chat History
  useEffect(() => {
    if (messages.length === 0) return;

    try {
      const savedStr = localStorage.getItem('safespeak_history');
      let history = savedStr ? JSON.parse(savedStr) : [];
      
      // Find current session or create it
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

  return (
    <div className="app-shell relative flex h-full w-full max-w-5xl flex-col text-[#f6f2e9]">
      {/* Sticky Header */}
      <div className="glass-panel sticky top-0 z-10 flex flex-col items-center border-x-0 border-t-0 p-4 text-center">
        <p className="mb-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#e8795d]">
          <Sparkles size={12} />
          Topic: {peerInfo?.topic || 'General'}
        </p>
        <p className="flex items-center gap-1 text-[10px] text-[#91bb8e]">
          <Globe2 size={12} /> Live translation from {peerLangName} <LockKeyhole size={11} className="ml-2" /> encrypted room
        </p>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-28 sm:px-[10%]">
        <div className="mx-auto my-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-[#70817a]">
          <CheckCheck size={13} className="text-[#91bb8e]" /> Secure room opened
        </div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === socket.id;
          
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                isMe 
                  ? 'rounded-br-sm bg-[#e8795d] text-[#101a1a] shadow-[0_8px_25px_rgba(232,121,93,.15)]' 
                  : 'glass-panel rounded-bl-sm text-[#f6f2e9]'
              }`}>
                {/* Translated/Primary Text */}
                <p className="text-sm leading-relaxed">{msg.translatedText}</p>
                
                {/* Original Text Subtitle (Only show if it was actually translated and not sent by me) */}
                {!isMe && msg.originalText !== msg.translatedText && (
                    <p className="mt-2 border-t border-black/10 pt-1 text-[10px] italic opacity-70">
                    {msg.originalText}
                  </p>
                )}
              </div>
            </div>
          );
        })}
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
