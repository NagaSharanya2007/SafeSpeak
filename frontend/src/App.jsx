import { useState, useEffect } from 'react';
import LandingScreen from './components/LandingScreen';
import OnboardingFlow from './components/OnboardingFlow';
import WaitingScreen from './components/WaitingScreen';
import ChatRoom from './components/ChatRoom';
import About from './components/About';
import { socket } from './socket';

function App() {
  const [step, setStep] = useState(1);
  const [userPreferences, setUserPreferences] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('matched', (data) => {
      setPeerInfo(data);
      setStep(4); // Chat is step 4 (1: Landing, 2: Intake, 3: Wait, 4: Chat)
      setMessages([]);
    });

    socket.on('peer_disconnected', () => {
      alert("Your peer has disconnected.");
      setStep(1);
      setPeerInfo(null);
      setMessages([]);
    });

    return () => {
      socket.off('connect');
      socket.off('matched');
      socket.off('peer_disconnected');
    };
  }, []);

  const handleStart = () => {
    setStep(2);
  };

  const handleProceed = (prefs) => {
    setUserPreferences(prefs);
    setStep(3);
    socket.emit('find_peer', { 
      context: prefs.context, 
      mood: prefs.mood, 
      interest: prefs.interest,
      language: prefs.language
    });
  };

  const handleCancelWait = () => {
    setStep(2);
    socket.emit('cancel_find');
  };

  return (
    <div className="app-shell min-h-screen w-full flex justify-center items-center relative overflow-x-hidden overflow-y-auto font-sans">
      <div className="ambient-grid pointer-events-none absolute inset-0" />
      <div className="ambient-orb pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full border border-[#e8795d]/20 bg-[#d9694b]/10 blur-sm" />
      <div className="ambient-orb-delayed pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full border border-[#91bb8e]/20 bg-[#91bb8e]/10 blur-sm" />
      
      {/* Main App Container - Full screen immersive */}
      <div className="w-full h-full relative z-10 flex flex-col items-center justify-center p-4 transition-all duration-300">
        {!isConnected && (
          <div className="absolute inset-0 bg-[#101a1a]/90 z-50 flex items-center justify-center text-[#f6f2e9] backdrop-blur-md font-sans">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#e8795d]" />
              Connecting to server...
            </div>
          </div>
        )}

        {step === 1 && <LandingScreen onStart={handleStart} onAbout={() => setStep(5)} />}
        {step === 2 && <OnboardingFlow onProceed={handleProceed} />}
        {step === 3 && <WaitingScreen onCancel={handleCancelWait} />}
        {step === 4 && (
          <ChatRoom 
            peerInfo={peerInfo} 
            messages={messages} 
            setMessages={setMessages} 
          />
        )}
        {step === 5 && <About onEnter={handleStart} />}
      </div>
    </div>
  );
}

export default App;
