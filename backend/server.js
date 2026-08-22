require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./database');
const natural = require('natural');
const { translateText } = require('./services/translationService');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST']
  }
});

// Setup NLP tools for Smart Matchmaking
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
// Stop words to ignore during matching
const STOP_WORDS = new Set(['i', 'am', 'feeling', 'a', 'the', 'to', 'is', 'my', 'and', 'of', 'in', 'it', 'that', 'with']);

const getKeywords = (text) => {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens
    .filter(token => !STOP_WORDS.has(token))
    .map(token => stemmer.stem(token));
};

// In-memory arrays/maps for matchmaking state
let waitingQueue = [];
let activeRooms = new Map();

/**
 * Attempts to match users in the waitingQueue based on topic or wildcard status.
 */
const matchUsers = () => {
  if (waitingQueue.length < 2) return;

  // We check if either user requires an exact/semantic match. If exactMatchOnly is false for either, they can match broadly.
  for (let i = 0; i < waitingQueue.length; i++) {
    for (let j = i + 1; j < waitingQueue.length; j++) {
      const u1 = waitingQueue[i];
      const u2 = waitingQueue[j];

      // Smart Match logic: check if topics are exactly the same, OR if their keywords overlap
      const u1Keywords = u1.keywords;
      const u2Keywords = u2.keywords;
      const hasSemanticOverlap = u1Keywords.some(kw => u2Keywords.includes(kw)) && u1Keywords.length > 0;

      if (u1.topic === u2.topic || hasSemanticOverlap || !u1.exactMatchOnly || !u2.exactMatchOnly) {
        // We found a match!
        const roomId = `room_${u1.id}_${u2.id}`;
        
        // Remove both from queue (remove highest index first to avoid shift bugs)
        waitingQueue.splice(Math.max(i, j), 1);
        waitingQueue.splice(Math.min(i, j), 1);

        // Clear their timeouts
        clearTimeout(u1.timeout);
        clearTimeout(u2.timeout);

        // Join sockets to the new room
        u1.socket.join(roomId);
        u2.socket.join(roomId);

        // Determine if they matched exactly or fell back to general
        const isExactMatch = u1.topic === u2.topic;
        const topicName = isExactMatch ? u1.topic : 'General';

        // Track active room mapping for disconnect handling and translation routing
        activeRooms.set(u1.id, { roomId, peerId: u2.id, language: u1.language, peerLanguage: u2.language });
        activeRooms.set(u2.id, { roomId, peerId: u1.id, language: u2.language, peerLanguage: u1.language });

        // Emit matched event with room & topic info (and peer's original language for the header)
        u1.socket.emit('matched', { roomId, topic: topicName, peerId: u2.id, peerLanguage: u2.language });
        u2.socket.emit('matched', { roomId, topic: topicName, peerId: u1.id, peerLanguage: u1.language });
        
        // Recursively try to match remaining users
        return matchUsers();
      }
    }
  }
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Matchmaking: Find a peer
  socket.on('find_peer', (data) => {
    // 1. Custom Topic Normalization: lowercase and trim
    let topic = (data?.topic || 'general').trim().toLowerCase();
    let emergencyContact = (data?.emergencyContact || '').trim();
    let language = data?.language || 'en';

    
    // Save to Database
    db.run(
      `INSERT INTO users (socket_id, topic, emergency_contact) VALUES (?, ?, ?)`,
      [socket.id, topic, emergencyContact],
      (err) => {
        if (err) console.error("Database Insert Error:", err);
      }
    );

    // Get Semantic Keywords
    const keywords = getKeywords(topic);
    
    const userEntry = {
      id: socket.id,
      socket: socket,
      topic: topic,
      keywords: keywords,
      language: language,
      exactMatchOnly: true,
      joinTime: Date.now(),
      timeout: null
    };

    // 2. Fallback Match: After 15 seconds, broaden search criteria
    userEntry.timeout = setTimeout(() => {
      const userIndex = waitingQueue.findIndex(u => u.id === socket.id);
      if (userIndex !== -1) {
        waitingQueue[userIndex].exactMatchOnly = false;
        // Broadcast to server to try matching again with relaxed constraints
        matchUsers();
      }
    }, 15000);

    waitingQueue.push(userEntry);
    
    // Attempt match immediately
    matchUsers();
  });

  // Handle sudden disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // 3. Disconnect Cleanup: Remove from waitingQueue if they haven't matched yet
    const qIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (qIndex !== -1) {
      clearTimeout(waitingQueue[qIndex].timeout);
      waitingQueue.splice(qIndex, 1);
    }

    // 4. Abandoned Match: If they were in an active chat, alert the peer
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      
      // Notify remaining peer that their partner left
      io.to(peerId).emit('peer_disconnected');
    }
  });

  // Phase 2: Live Multilingual Chat Routing
  socket.on('send_message', async ({ text }) => {
    if (!text || text.trim() === '') return;

    const roomInfo = activeRooms.get(socket.id);
    if (!roomInfo) return; // User is not in an active chat

    const { peerId, language: myLanguage, peerLanguage } = roomInfo;
    
    // Attempt real-time translation
    const translatedText = await translateText(text, myLanguage, peerLanguage);

    // Emit back to sender (echo) so they see it instantly without translation
    socket.emit('receive_message', { 
      senderId: socket.id, 
      originalText: text, 
      translatedText: text // Sender sees their own text
    });

    // Emit to peer
    io.to(peerId).emit('receive_message', {
      senderId: socket.id,
      originalText: text,
      translatedText: translatedText
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
