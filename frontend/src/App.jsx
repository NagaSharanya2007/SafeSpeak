import { useState, useEffect } from 'react';
import LandingScreen from './components/LandingScreen';
import OnboardingFlow from './components/OnboardingFlow';
import WaitingScreen from './components/WaitingScreen';
import ChatRoom from './components/ChatRoom';
import About from './components/About';
import Sidebar from './components/Sidebar';
import ReadOnlyChat from './components/ReadOnlyChat';
import { socket } from './socket';
import { Menu } from 'lucide-react';

function App() {
  const [step, setStep] = useState(1);
  const [userPreferences, setUserPreferences] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // ChatGPT Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

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
    <div className="app-shell flex h-[100dvh] w-full overflow-hidden font-sans bg-[#101a1a]">
      {/* Ambient background applied globally */}
      <div className="ambient-grid pointer-events-none fixed inset-0 z-0" />
      <div className="ambient-orb pointer-events-none fixed -left-24 top-16 z-0 h-72 w-72 rounded-full border border-[#e8795d]/20 bg-[#d9694b]/10 blur-sm" />
      <div className="ambient-orb-delayed pointer-events-none fixed -right-24 bottom-0 z-0 h-96 w-96 rounded-full border border-[#91bb8e]/20 bg-[#91bb8e]/10 blur-sm" />

      {/* Sidebar Component */}
      {(step === 4 || step === 7) && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          onSelectChat={(session) => {
            setSelectedHistory(session);
            setStep(7); // 7: Read Only History
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onNewChat={() => {
            setSelectedHistory(null);
            setStep(1);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
        />
      )}
      
      {/* Main App Container */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full flex flex-col">
        {/* Mobile Hamburger Menu */}
        {(step === 4 || step === 7) && (
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="md:hidden absolute top-4 left-4 z-40 p-2 text-[#b7c5b4] bg-[#101a1a]/80 backdrop-blur-md rounded-xl shadow-sm border border-white/10 hover:bg-[#101a1a]"
          >
            <Menu size={20} />
          </button>
        )}

        {!isConnected && (
          <div className="absolute inset-0 bg-[#101a1a]/90 z-50 flex items-center justify-center text-[#f6f2e9] backdrop-blur-md font-sans">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#e8795d]" />
              Connecting to server...
            </div>
          </div>
        )}

        {/* View Routing */}
        <div className="flex-1 w-full flex flex-col items-center justify-center transition-all duration-300">
          {step === 1 && <LandingScreen onStart={handleStart} onAbout={() => setStep(5)} onHistory={() => setStep(7)} />}
          {step === 2 && <OnboardingFlow onProceed={handleProceed} />}
          {step === 3 && <WaitingScreen onCancel={handleCancelWait} />}
          {step === 4 && (
            <div className="w-full h-full p-4 md:p-8">
              <div className="w-full h-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <ChatRoom 
                  peerInfo={peerInfo} 
                  userLanguage={userPreferences?.language || 'en'}
                  messages={messages} 
                  setMessages={setMessages} 
                />
              </div>
            </div>
          )}
          {step === 5 && (
            <About onEnter={() => setStep(1)} />
          )}
          {step === 7 && (
            <div className="w-full h-full p-4 md:p-8">
              <div className="w-full h-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <ReadOnlyChat session={selectedHistory} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
