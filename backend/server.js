require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./database');
const { translateText } = require('./services/translationService');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST']
  }
});

// In-memory arrays/maps for matchmaking state
let waitingQueue = [];
let activeRooms = new Map();

// Anti-Bullying Shield State
const strikeCounts = new Map();
const blockedUsers = new Set();

const safetyCheck = (text) => {
  if (!text) return false;
  // Basic hackathon regex for toxic language (ignores self-venting like "I hate myself")
  const toxicPattern = /(hate you|ugly|stupid|idiot|kill yourself|kys|die|bitch|fuck you)/i;
  return toxicPattern.test(text);
};

/**
 * Calculates the affinity score between two users based on context, mood, and interest.
 */
const calculateScore = (userA, userB) => {
  let score = 0;
  
  if (userA.context === userB.context) score += 50;

  const m1 = userA.mood;
  const m2 = userB.mood;

  if (m1 === 'seeker' && m2 === 'seeker') {
    score -= 30; // PENALTY for co-rumination
  } else if (m1 === 'anchor' && m2 === 'anchor') {
    score -= 30; // PENALTY for wasting anchor capacity
  } else if ((m1 === 'seeker' && m2 === 'anchor') || (m1 === 'anchor' && m2 === 'seeker')) {
    score += 40;
  } else if (m1 === 'neutral' || m2 === 'neutral') {
    score += 20;
  }

  if (userA.interest === userB.interest) score += 10;

  return score;
};

/**
 * Attempts to match users in the waitingQueue using a greedy weighted graph approach.
 */
const matchUsers = () => {
  if (waitingQueue.length < 2) return;

  let bestPair = null;
  let bestScore = -Infinity;

  for (let i = 0; i < waitingQueue.length; i++) {
    for (let j = i + 1; j < waitingQueue.length; j++) {
      const u1 = waitingQueue[i];
      const u2 = waitingQueue[j];

      const score = calculateScore(u1, u2);
      
      // Valid score must be > 20
      if (score > 20 && score > bestScore) {
        bestScore = score;
        bestPair = { i, j, u1, u2 };
      }
    }
  }

  if (bestPair) {
    const { i, j, u1, u2 } = bestPair;
    
    // Remove both from queue (highest index first)
    waitingQueue.splice(Math.max(i, j), 1);
    waitingQueue.splice(Math.min(i, j), 1);

    const roomId = `room_${u1.id}_${u2.id}`;
    
    u1.socket.join(roomId);
    u2.socket.join(roomId);

    // Track active room mapping for disconnect handling and translation routing
    activeRooms.set(u1.id, { roomId, peerId: u2.id, language: u1.language, peerLanguage: u2.language });
    activeRooms.set(u2.id, { roomId, peerId: u1.id, language: u2.language, peerLanguage: u1.language });

    // Emit matched event with room & peer's interest as the icebreaker topic
    u1.socket.emit('matched', { roomId, topic: u2.interest, peerId: u2.id, peerLanguage: u2.language });
    u2.socket.emit('matched', { roomId, topic: u1.interest, peerId: u1.id, peerLanguage: u1.language });

    // Recursively try to match remaining users
    matchUsers();
  }
};

// Matchmaking execution loop
setInterval(matchUsers, 3000);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Matchmaking: Find a peer
  socket.on('find_peer', (data) => {
    if (blockedUsers.has(socket.id)) {
      socket.emit('sender_restricted');
      return;
    }

    let context = data?.context || 'General';
    let mood = data?.mood || 'neutral';
    let interest = data?.interest || 'General';
    let language = data?.language || 'en';
    
    // Save to Database (using context as topic to preserve schema)
    db.run(
      `INSERT INTO users (socket_id, topic, emergency_contact) VALUES (?, ?, ?)`,
      [socket.id, context, ''],
      (err) => {
        if (err) console.error("Database Insert Error:", err);
      }
    );

    const userEntry = {
      id: socket.id,
      socket: socket,
      context,
      mood,
      interest,
      language,
      joinTime: Date.now()
    };

    waitingQueue.push(userEntry);
  });

  // Handle sudden disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // 3. Disconnect Cleanup: Remove from waitingQueue if they haven't matched yet
    const qIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (qIndex !== -1) {
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

  socket.on('leave_room', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      io.to(peerId).emit('peer_disconnected');
    }
  });

  socket.on('block_user', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      io.to(peerId).emit('peer_disconnected');
      
      blockedUsers.add(peerId);
      const peerSocket = io.sockets.sockets.get(peerId);
      if (peerSocket) peerSocket.disconnect(true);
    }
  });

  // Phase 2: Live Multilingual Chat Routing with Anti-Bullying Shield
  socket.on('send_message', async ({ text }) => {
    if (!text || text.trim() === '') return;

    const roomInfo = activeRooms.get(socket.id);
    if (!roomInfo) return; // User is not in an active chat

    const { peerId, language: myLanguage, peerLanguage } = roomInfo;
    
    // Attempt real-time translation
    const translatedText = await translateText(text, myLanguage, peerLanguage);

    // SAFETY CHECK: Pre-translation & Post-translation check
    const isFlagged = safetyCheck(text) || safetyCheck(translatedText);

    if (isFlagged) {
      let strikes = (strikeCounts.get(socket.id) || 0) + 1;
      strikeCounts.set(socket.id, strikes);
      
      // Sender sees their own message normally (or we can inject a warning after)
      socket.emit('receive_message', { 
        senderId: socket.id, 
        originalText: text, 
        translatedText: text 
      });

      if (strikes >= 5) {
        socket.emit('sender_restricted');
        blockedUsers.add(socket.id);
        
        activeRooms.delete(socket.id);
        activeRooms.delete(peerId);
        io.to(peerId).emit('peer_disconnected');
        socket.disconnect(true);
        return;
      } else {
        socket.emit('sender_warning', { strikeCount: strikes });
        
        io.to(peerId).emit('flagged_intercept', {
          senderId: socket.id,
          originalText: text,
          translatedText: translatedText
        });
        return;
      }
    }

    // Normal safe flow
    socket.emit('receive_message', { 
      senderId: socket.id, 
      originalText: text, 
      translatedText: text 
    });

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
