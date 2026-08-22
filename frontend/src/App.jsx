import { useState, useEffect } from 'react';
import Header from './components/Header';
import TopicPicker from './components/TopicPicker';
import WaitingScreen from './components/WaitingScreen';
import ChatRoom from './components/ChatRoom';
import { socket } from './socket';

function App() {
  const [screen, setScreen] = useState('onboarding'); // 'onboarding' | 'waiting' | 'chat'
  const [userPreferences, setUserPreferences] = useState({});
  const [peerInfo, setPeerInfo] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Establish connection when app mounts
    socket.connect();

    // Listen for successful match
    socket.on('matched', (data) => {
      setPeerInfo(data);
      setScreen('chat');
    });

    // Handle case where partner disconnects during an active chat
    socket.on('peer_disconnected', () => {
      alert('Your partner has disconnected. Returning to home.');
      setScreen('onboarding');
      setPeerInfo(null);
      setMessages([]);
    });

    return () => {
      socket.off('matched');
      socket.off('peer_disconnected');
      socket.disconnect();
    };
  }, []);

  const handleProceed = (prefs) => {
    setUserPreferences(prefs);
    setScreen('waiting');
    // Emit find_peer with selected topic and language
    socket.emit('find_peer', { 
      topic: prefs.topic, 
      language: prefs.language, 
      emergencyContact: prefs.emergencyContact 
    });
  };

  const handleCancelWait = () => {
    // Disconnect and reconnect to clear socket state on the server
    socket.disconnect();
    socket.connect();
    setScreen('onboarding');
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col max-w-md mx-auto bg-primary overflow-hidden relative shadow-2xl">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        {screen === 'onboarding' && (
          <TopicPicker onProceed={handleProceed} />
        )}
        
        {screen === 'waiting' && (
          <WaitingScreen onCancel={handleCancelWait} />
        )}
        
        {screen === 'chat' && (
          <ChatRoom 
            peerInfo={peerInfo}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </main>
    </div>
  );
}

export default App;
