require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const nlp = require('compromise');

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./database');
const { translateText } = require('./services/translationService');
const { checkHarmfulContent, checkSuicideRisk } = require('./services/safetyService');
const { notifyEmergencyContact } = require('./services/emergencyService');
const { generateEmpathyResponse } = require('./services/aiCopilotService');
let analyzeTranscript = null;
try {
  const daService = require('./services/DataAltruismService');
  analyzeTranscript = daService.analyzeTranscript;
} catch (e) {
  // Optional DataAltruismService fallback
}

// ----------------------------------------------------------------------------
// HTTP API Endpoints
// ----------------------------------------------------------------------------

// 1. Empathy Copilot (Google Gemini AI API)
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

// 2. User Authentication & Account APIs
app.post('/api/signup', (req, res) => {
  const { username, emergencyContact } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  
  const userId = 'user_' + crypto.randomUUID();
  
  db.run(
    `INSERT INTO accounts (user_id, username, emergency_contact) VALUES (?, ?, ?)`,
    [userId, username, emergencyContact || ''],
    function(err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, user: { userId, username, emergencyContact: emergencyContact || '' } });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  
  db.get(
    `SELECT user_id as userId, username, emergency_contact as emergencyContact, strikes FROM accounts WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      
      if (row.strikes > 0) {
        strikeCounts.set(row.userId, row.strikes);
        if (row.strikes >= 5) {
          blockedUsers.add(row.userId);
        }
      }
      
      res.json({ success: true, user: row });
    }
  );
});

// 3. Researcher Portal APIs
app.post('/api/research/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@safespeak.org' && password === 'password') {
    res.json({ success: true, token: 'researcher-jwt-mock' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/research/reports', (req, res) => {
  db.all(`SELECT * FROM research_trends ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true, reports: rows });
  });
});

// ----------------------------------------------------------------------------
// PII Masking Utility
// ----------------------------------------------------------------------------
const maskPII = (text) => {
  if (!text) return text;
  const maskTag = '[cant share data due to privacy issues]';
  
  try {
    let doc = nlp(text);
    doc.people().replaceWith(maskTag);
    doc.organizations().replaceWith(maskTag);
    let maskedText = doc.text();
    
    maskedText = maskedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, maskTag);
    maskedText = maskedText.replace(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, maskTag);
    maskedText = maskedText.replace(/@[a-zA-Z0-9_.]+/g, maskTag);
    maskedText = maskedText.replace(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|twitter\.com|x\.com|snapchat\.com|facebook\.com)\/[a-zA-Z0-9_.-]+/gi, maskTag);
    maskedText = maskedText.replace(/(my name is\s+|i am\s+|i'm\s+|call me\s+|this is\s+)([a-z]+)/gi, `$1${maskTag}`);
    maskedText = maskedText.replace(/(my password is\s+|my username is\s+|password:\s+|username:\s+)(\S+)/gi, `$1${maskTag}`);
    return maskedText;
  } catch (e) {
    return text;
  }
};

// ----------------------------------------------------------------------------
// Matchmaking & Socket Server
// ----------------------------------------------------------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let waitingQueue = [];
let activeRooms = new Map();
let activeRoomMessages = new Map();
const strikeCounts = new Map();
const blockedUsers = new Set();
const blockedPairs = new Set();
const emergencySentRooms = new Set();

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

const isPairBlocked = (id1, id2) => {
  return blockedPairs.has(`${id1}:${id2}`) || 
         blockedPairs.has(`${id2}:${id1}`) ||
         blockedUsers.has(id1) ||
         blockedUsers.has(id2);
};

const matchUsers = () => {
  if (waitingQueue.length < 2) return;

  let bestPair = null;
  let bestScore = -Infinity;

  for (let i = 0; i < waitingQueue.length; i++) {
    for (let j = i + 1; j < waitingQueue.length; j++) {
      const u1 = waitingQueue[i];
      const u2 = waitingQueue[j];

      if (isPairBlocked(u1.id, u2.id)) continue;

      const score = calculateScore(u1, u2);
      if (score > 20 && score > bestScore) {
        bestScore = score;
        bestPair = { i, j, u1, u2 };
      }
    }
  }

  if (bestPair) {
    const { i, j, u1, u2 } = bestPair;
    waitingQueue.splice(Math.max(i, j), 1);
    waitingQueue.splice(Math.min(i, j), 1);

    const roomId = `room_${u1.id}_${u2.id}`;
    
    u1.socket.join(roomId);
    u2.socket.join(roomId);

    activeRooms.set(u1.id, { 
      roomId, 
      peerId: u2.id, 
      language: u1.language, 
      peerLanguage: u2.language,
      emergencyContact: u1.emergencyContact,
      userId: u1.userId,
      alias: u1.alias,
      peerUserId: u2.userId,
      peerAlias: u2.alias
    });

    activeRooms.set(u2.id, { 
      roomId, 
      peerId: u1.id, 
      language: u2.language, 
      peerLanguage: u1.language,
      emergencyContact: u2.emergencyContact,
      userId: u2.userId,
      alias: u2.alias,
      peerUserId: u1.userId,
      peerAlias: u1.alias
    });

    u1.socket.emit('matched', { roomId, topic: u2.interest, peerId: u2.id, peerLanguage: u2.language, peerAlias: u2.alias });
    u2.socket.emit('matched', { roomId, topic: u1.interest, peerId: u1.id, peerLanguage: u1.language, peerAlias: u1.alias });

    activeRoomMessages.set(roomId, []);
    matchUsers();
  }
};

setInterval(matchUsers, 3000);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Matchmaking: Find a peer
  socket.on('find_peer', (data) => {
    let userId = data?.userId || socket.id;
    let alias = data?.alias || 'Anonymous';

    if (blockedUsers.has(userId)) {
      socket.emit('sender_restricted');
      return;
    }

    let context = data?.context || 'General';
    let mood = data?.mood || 'neutral';
    let interest = data?.interest || 'General';
    let language = data?.language || 'en';
    let emergencyContact = data?.emergencyContact || '';
    
    db.run(
      `INSERT INTO users (socket_id, topic, emergency_contact) VALUES (?, ?, ?)`,
      [socket.id, context, emergencyContact],
      (err) => {
        if (err) console.error("Database Insert Error:", err);
      }
    );

    const userEntry = {
      id: socket.id,
      userId,
      alias,
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

  // Disconnection cleanup
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const qIndex = waitingQueue.findIndex(u => u.id === socket.id);
    if (qIndex !== -1) {
      waitingQueue.splice(qIndex, 1);
    }

    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, roomId } = roomInfo;
      const messages = activeRoomMessages.get(roomId);
      if (messages && messages.length > 0 && analyzeTranscript) {
        analyzeTranscript(messages);
        activeRoomMessages.delete(roomId);
      }

      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      io.to(peerId).emit('peer_disconnected');
    }
  });

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
      const messages = activeRoomMessages.get(roomId);
      if (messages && messages.length > 0 && analyzeTranscript) {
        analyzeTranscript(messages);
        activeRoomMessages.delete(roomId);
      }
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      io.to(peerId).emit('peer_disconnected');
    }
  });

  socket.on('block_peer', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, peerUserId, roomId } = roomInfo;
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      if (roomId) emergencySentRooms.delete(roomId);
      
      blockedPairs.add(`${socket.id}:${peerId}`);
      blockedPairs.add(`${peerId}:${socket.id}`);

      if (peerUserId) {
        blockedUsers.add(peerUserId);
        strikeCounts.set(peerUserId, 5);
        db.run(`UPDATE accounts SET strikes = 5 WHERE user_id = ?`, [peerUserId]);
      }

      db.run(
        `INSERT INTO blocked_users (user_id, blocked_id) VALUES (?, ?)`,
        [socket.id, peerId],
        (err) => {
          if (err) console.error("Database Block Insert Error:", err);
        }
      );

      io.to(peerId).emit('peer_disconnected');
      const peerSocket = io.sockets.sockets.get(peerId);
      if (peerSocket) peerSocket.disconnect(true);
    }
    socket.emit('blocked_success');
  });

  // Empathy Copilot AI Socket Handler (Google Gemini AI API)
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

  // Manual emergency trigger
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

  // Live Multilingual Chat Routing with Safety, Suicide Risk, & Anti-Bullying
  socket.on('send_message', async ({ text: incomingText }) => {
    if (!incomingText || incomingText.trim() === '') return;
    
    const text = maskPII(incomingText);
    const roomInfo = activeRooms.get(socket.id);
    if (!roomInfo) return;

    const { peerId, language: myLanguage, peerLanguage, emergencyContact, roomId, alias } = roomInfo;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const msgs = activeRoomMessages.get(roomId);
    if (msgs) msgs.push(`${alias || 'User'}: ${text}`);

    // 1. Multilingual Translation
    const translatedText = await translateText(text, myLanguage, peerLanguage);

    // 2. Suicide Risk & Self-Harm Safety Layer (LOW, MEDIUM, HIGH / IMMINENT)
    const suicideRisk = checkSuicideRisk(text, translatedText);
    
    if (suicideRisk.riskLevel === 'HIGH_IMMINENT') {
      const alreadySent = emergencySentRooms.has(roomInfo.roomId);
      let dispatchResult = { success: true, status: 'SENT', mode: 'escalation_active' };

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
    } else if (suicideRisk.riskLevel === 'CONCERNING') {
      // Trigger supportive intervention: Empathy Copilot actively steps in
      socket.emit('suicide_risk_concern', {
        messageId,
        riskLevel: 'CONCERNING',
        reason: suicideRisk.reason,
        autoOpenCopilot: true,
        hasEmergencyContact: !!(emergencyContact && emergencyContact.trim())
      });
    } else if (suicideRisk.riskLevel === 'LOW') {
      // Trigger mild supportive card
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

      io.to(peerId).emit('receive_message', {
        id: messageId,
        senderId: socket.id,
        originalText: text,
        translatedText: translatedText,
        isHarmful: true,
        isHidden: true,
        harmCategory: harmfulResult.category
      });

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
