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
const { checkHarmfulContent, checkSuicideRisk } = require('./services/safetyService');
const { notifyEmergencyContact } = require('./services/emergencyService');
const { generateEmpathyResponse } = require('./services/aiCopilotService');

// HTTP API endpoint for Empathy Copilot (uses Google AI API)
app.post('/api/copilot/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const responseText = await generateEmpathyResponse(history || [], message || '');
    res.json({ success: true, text: responseText });
  } catch (err) {
    console.error("[Copilot HTTP API Error]:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST']
  }
});

// In-memory state for matchmaking and safety
let waitingQueue = [];
let activeRooms = new Map();
const strikeCounts = new Map();
const blockedUsers = new Set();
const blockedPairs = new Set();
const emergencySentRooms = new Set();


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
 * Checks if two users have blocked each other.
 */
const isPairBlocked = (id1, id2) => {
  return blockedPairs.has(`${id1}:${id2}`) || 
         blockedPairs.has(`${id2}:${id1}`) ||
         blockedUsers.has(id1) ||
         blockedUsers.has(id2);
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

      // Exclude blocked users from matching together
      if (isPairBlocked(u1.id, u2.id)) continue;

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

    // Track active room mapping for disconnect handling, translation routing, and emergency contact
    activeRooms.set(u1.id, { 
      roomId, 
      peerId: u2.id, 
      language: u1.language, 
      peerLanguage: u2.language,
      emergencyContact: u1.emergencyContact 
    });
    activeRooms.set(u2.id, { 
      roomId, 
      peerId: u1.id, 
      language: u2.language, 
      peerLanguage: u1.language,
      emergencyContact: u2.emergencyContact 
    });

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
    let emergencyContact = data?.emergencyContact || '';
    
    // Save to Database (using context as topic to preserve schema)
    db.run(
      `INSERT INTO users (socket_id, topic, emergency_contact) VALUES (?, ?, ?)`,
      [socket.id, context, emergencyContact],
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
      emergencyContact,
      joinTime: Date.now()
    };

    waitingQueue.push(userEntry);
  });

  // Cancel queue wait
  socket.on('cancel_find', () => {
    const qIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (qIndex !== -1) {
      waitingQueue.splice(qIndex, 1);
    }
  });

  // Handle sudden disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Disconnect Cleanup: Remove from waitingQueue if they haven't matched yet
    const qIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (qIndex !== -1) {
      waitingQueue.splice(qIndex, 1);
    }

    // Abandoned Match: If they were in an active chat, alert the peer
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, roomId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      
      // Notify remaining peer that their partner left
      io.to(peerId).emit('peer_disconnected');
    }
  });

  // User explicitly disconnects temporarily ("Disconnect for now")
  socket.on('disconnect_peer', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, roomId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      io.to(peerId).emit('peer_disconnected');
    }
    socket.emit('disconnected_success');
  });

  socket.on('leave_room', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, roomId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      io.to(peerId).emit('peer_disconnected');
    }
  });

  // User permanently blocks their chat partner
  socket.on('block_peer', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, roomId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      
      // Record persistent block
      blockedPairs.add(`${socket.id}:${peerId}`);
      blockedPairs.add(`${peerId}:${socket.id}`);


      db.run(
        `INSERT INTO blocked_users (user_id, blocked_id) VALUES (?, ?)`,
        [socket.id, peerId],
        (err) => {
          if (err) console.error("Database Block Insert Error:", err);
        }
      );

      // Notify peer that conversation has ended
      io.to(peerId).emit('peer_disconnected');
    }
    socket.emit('blocked_success');
  });

  // Real-time Copilot Chat handler (uses Google AI API)
  socket.on('copilot_chat', async ({ message, history }, callback) => {

    try {
      const responseText = await generateEmpathyResponse(history || [], message || '');
      if (typeof callback === 'function') {
        callback({ success: true, text: responseText });
      } else {
        socket.emit('copilot_reply', { text: responseText });
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Manual emergency escalation trigger

  socket.on('trigger_emergency', async () => {
    const roomInfo = activeRooms.get(socket.id);
    const emergencyContact = roomInfo?.emergencyContact || '';
    
    const result = await notifyEmergencyContact({
      socketId: socket.id,
      emergencyContact,
      riskLevel: 'HIGH_IMMINENT'
    });

    socket.emit('emergency_dispatched', {
      success: true,
      hasContact: !!(emergencyContact && emergencyContact.trim()),
      timestamp: result.timestamp
    });
  });

  // Live Multilingual Chat Routing with Safety & Suicide Risk Layers
  socket.on('send_message', async ({ text }) => {
    if (!text || text.trim() === '') return;

    const roomInfo = activeRooms.get(socket.id);
    if (!roomInfo) return; // User is not in an active chat

    const { peerId, language: myLanguage, peerLanguage, emergencyContact } = roomInfo;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // 1. Existing Real-time Translation
    const translatedText = await translateText(text, myLanguage, peerLanguage);

    // 2. Suicide Risk & Self-Harm Safety Layer (LOW, MEDIUM / CONCERNING, HIGH_IMMINENT)
    const suicideRisk = checkSuicideRisk(text, translatedText);
    
    if (suicideRisk.riskLevel === 'HIGH_IMMINENT') {
      const alreadySent = emergencySentRooms.has(roomInfo.roomId);
      let dispatchResult = { success: false, status: 'NOT_CONFIGURED', mode: 'demo_not_configured' };

      if (!alreadySent) {
        emergencySentRooms.add(roomInfo.roomId);
        dispatchResult = await notifyEmergencyContact({
          socketId: socket.id,
          emergencyContact,
          riskLevel: 'HIGH_IMMINENT'
        });
      }

      socket.emit('suicide_risk_imminent', {
        messageId,
        riskLevel: 'HIGH_IMMINENT',
        reason: suicideRisk.reason,
        emergencyDispatched: dispatchResult.success,
        dispatchStatus: alreadySent ? 'ALREADY_SENT' : dispatchResult.status,
        dispatchMode: dispatchResult.mode,
        dispatchError: dispatchResult.error || null,
        hasEmergencyContact: !!(emergencyContact && emergencyContact.trim())
      });
    }
 else if (suicideRisk.riskLevel === 'CONCERNING') {
      // Trigger supportive intervention: Empathy Copilot actively steps in
      socket.emit('suicide_risk_concern', {
        messageId,
        riskLevel: 'CONCERNING',
        reason: suicideRisk.reason,
        autoOpenCopilot: true,
        hasEmergencyContact: !!(emergencyContact && emergencyContact.trim())
      });
    } else if (suicideRisk.riskLevel === 'LOW') {
      // Trigger mild supportive prompt
      socket.emit('suicide_risk_low', {
        messageId,
        riskLevel: 'LOW',
        reason: suicideRisk.reason
      });
    }



    // 3. Harmful & Bullying Detection Layer
    const harmfulResult = checkHarmfulContent(text, translatedText);

    if (harmfulResult.isHarmful) {
      const currentStrikes = (strikeCounts.get(socket.id) || 0) + 1;
      strikeCounts.set(socket.id, currentStrikes);
      
      // Sender receives message marked as flagged + sender warning notification
      socket.emit('receive_message', { 
        id: messageId,
        senderId: socket.id, 
        originalText: text, 
        translatedText: text,
        isHarmful: true,
        warningLevel: currentStrikes,
        harmCategory: harmfulResult.category
      });

      socket.emit('sender_warning', {
        messageId,
        strikeCount: currentStrikes,
        warningLevel: currentStrikes,
        reason: harmfulResult.reason
      });

      // Recipient receives message HIDDEN by default with harmful flag
      io.to(peerId).emit('receive_message', {
        id: messageId,
        senderId: socket.id,
        originalText: text,
        translatedText: translatedText,
        isHarmful: true,
        isHidden: true,
        harmCategory: harmfulResult.category
      });

      // Emit flagged intercept for receiver alert popup
      io.to(peerId).emit('flagged_intercept', {
        messageId,
        senderId: socket.id,
        harmCategory: harmfulResult.category
      });
      return;
    }

    // 4. Normal Safe Message Flow
    socket.emit('receive_message', { 
      id: messageId,
      senderId: socket.id, 
      originalText: text, 
      translatedText: text,
      isHarmful: false
    });

    io.to(peerId).emit('receive_message', {
      id: messageId,
      senderId: socket.id,
      originalText: text,
      translatedText: translatedText,
      isHarmful: false
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
