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
const crypto = require('crypto');
const nlp = require('compromise');
const { analyzeTranscript } = require('./services/DataAltruismService');

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
const activeRoomMessages = new Map(); // roomId -> Array of objects

function saveTranscriptToPending(messages) {
  const jsonStr = JSON.stringify(messages);
  db.run(`INSERT INTO chat_history (transcript_data, status) VALUES (?, 'pending')`, [jsonStr], function(err) {
    if (err) {
      console.error("Failed to save transcript to chat_history", err);
    }
  });
}

// Anti-Bullying Shield State
const strikeCounts = new Map();
const blockedUsers = new Set();

app.post('/api/signup', (req, res) => {
  const { username, emergencyContact } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  
  const userId = 'user_' + crypto.randomUUID();
  
  db.run(
    `INSERT INTO accounts (user_id, username, emergency_contact) VALUES (?, ?, ?)`,
    [userId, username, emergencyContact || ''],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
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
      
      // Load strikes into memory if they exist
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

// Researcher Portal APIs
app.post('/api/research/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@safespeak.org' && password === 'password') {
    res.json({ success: true, token: 'researcher-jwt-mock' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/research/extract', (req, res) => {
  db.all(`SELECT id, transcript_data FROM chat_history WHERE status = 'pending'`, [], async (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (rows.length === 0) {
      return res.json({ success: true, processed: 0 });
    }

    let processedCount = 0;
    
    // Process each transcript synchronously to avoid hitting API rate limits
    for (const row of rows) {
      try {
        const messages = JSON.parse(row.transcript_data);
        const trend = await analyzeTranscript(messages);
        
        // Save extracted report to chat_history and mark as processed
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE chat_history SET extracted_report = ?, status = 'processed' WHERE id = ?`,
            [JSON.stringify(trend), row.id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        processedCount++;
      } catch (e) {
        console.error("Failed to process transcript:", e);
      }
    }
    
    res.json({ success: true, processed: processedCount });
  });
});

app.get('/api/research/reports', (req, res) => {
  db.all(`SELECT id, transcript_data, extracted_report, created_at FROM chat_history WHERE status = 'processed' ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    // Parse JSON strings back into objects for the frontend
    const reports = rows.map(row => ({
      id: row.id,
      created_at: row.created_at,
      transcript: JSON.parse(row.transcript_data),
      report: JSON.parse(row.extracted_report)
    }));

    res.json({ success: true, reports });
  });
});

const safetyCheck = (text) => {
  if (!text) return false;
  // Basic hackathon regex for toxic language (ignores self-venting like "I hate myself")
  const toxicPattern = /(hate you|ugly|stupid|idiot|kill yourself|kys|die|bitch|fuck you)/i;
  return toxicPattern.test(text);
};

const maskPII = (text) => {
  if (!text) return text;
  
  const maskTag = '[cant share data due to privacy issues]';
  
  // Pass 1: NLP Name and Organization Detection
  let doc = nlp(text);
  doc.people().replaceWith(maskTag);
  doc.organizations().replaceWith(maskTag);
  let maskedText = doc.text();
  
  // Pass 2: Regex for strict formats
  // Mask Emails
  maskedText = maskedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, maskTag);
  
  // Mask Phone Numbers (10-14 digits, optional country code, dashes/spaces)
  maskedText = maskedText.replace(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, maskTag);
  
  // Mask Social Handles
  maskedText = maskedText.replace(/@[a-zA-Z0-9_.]+/g, maskTag);
  
  // Mask Social URLs
  maskedText = maskedText.replace(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|twitter\.com|x\.com|snapchat\.com|facebook\.com)\/[a-zA-Z0-9_.-]+/gi, maskTag);

  // Pass 3: Fallback Regex for Introductions & Credentials (catches names not in NLP dict)
  maskedText = maskedText.replace(/(my name is\s+|i am\s+|i'm\s+|call me\s+|this is\s+)([a-z]+)/gi, `$1${maskTag}`);
  
  // Catch explicit sharing of usernames or passwords
  maskedText = maskedText.replace(/(my password is\s+|my username is\s+|password:\s+|username:\s+)(\S+)/gi, `$1${maskTag}`);

  return maskedText;
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
    activeRooms.set(u1.id, { 
      roomId, 
      peerId: u2.id, 
      language: u1.language, 
      peerLanguage: u2.language,
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
      userId: u2.userId,
      alias: u2.alias,
      peerUserId: u1.userId,
      peerAlias: u1.alias
    });

    // Emit matched event with room & peer's interest as the icebreaker topic
    u1.socket.emit('matched', { roomId, topic: u2.interest, peerId: u2.id, peerLanguage: u2.language, peerAlias: u2.alias });
    u2.socket.emit('matched', { roomId, topic: u1.interest, peerId: u1.id, peerLanguage: u1.language, peerAlias: u1.alias });

    // Initialize transcript storage for the LLM
    activeRoomMessages.set(roomId, []);

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

    const userEntry = {
      id: socket.id,
      userId,
      alias,
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
      const { peerId, roomId } = roomInfo;
      
      // Flush transcript to pending storage
      const messages = activeRoomMessages.get(roomId);
      if (messages && messages.length > 0) {
        saveTranscriptToPending(messages);
        activeRoomMessages.delete(roomId);
      }
      
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      
      // Notify remaining peer that their partner left
      io.to(peerId).emit('peer_disconnected');
    }
  });

  socket.on('leave_room', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, roomId } = roomInfo;
      
      // Flush transcript to pending storage
      const messages = activeRoomMessages.get(roomId);
      if (messages && messages.length > 0) {
        saveTranscriptToPending(messages);
        activeRoomMessages.delete(roomId);
      }
      
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      io.to(peerId).emit('peer_disconnected');
    }
  });

  socket.on('block_user', () => {
    const roomInfo = activeRooms.get(socket.id);
    if (roomInfo) {
      const { peerId, peerUserId, roomId } = roomInfo;
      
      // Flush transcript to pending storage
      const messages = activeRoomMessages.get(roomId);
      if (messages && messages.length > 0) {
        saveTranscriptToPending(messages);
        activeRoomMessages.delete(roomId);
      }
      
      activeRooms.delete(socket.id);
      activeRooms.delete(peerId);
      io.to(peerId).emit('peer_disconnected');
      
      if (peerUserId) {
        blockedUsers.add(peerUserId);
        strikeCounts.set(peerUserId, 5);
        db.run(`UPDATE accounts SET strikes = 5 WHERE user_id = ?`, [peerUserId]);
      }
      
      const peerSocket = io.sockets.sockets.get(peerId);
      if (peerSocket) peerSocket.disconnect(true);
    }
  });

  // Phase 2: Live Multilingual Chat Routing with Anti-Bullying Shield & PII Scrubber
  socket.on('send_message', async ({ text: incomingText }) => {
    if (!incomingText || incomingText.trim() === '') return;
    
    // 1. Scrub PII before any other processing
    const text = maskPII(incomingText);

    const roomInfo = activeRooms.get(socket.id);
    if (!roomInfo) return; // User is not in an active chat

    const { peerId, language: myLanguage, peerLanguage, userId, roomId, alias } = roomInfo;
    
    // Store message in memory for LLM analysis
    const msgs = activeRoomMessages.get(roomId);
    if (msgs) msgs.push(`${alias}: ${text}`);
    
    // Attempt real-time translation
    const translatedText = await translateText(text, myLanguage, peerLanguage);

    // SAFETY CHECK: Pre-translation & Post-translation check
    const isFlagged = safetyCheck(text) || safetyCheck(translatedText);

    if (isFlagged) {
      let strikes = (strikeCounts.get(userId) || 0) + 1;
      strikeCounts.set(userId, strikes);
      
      // Update database strikes count
      db.run(`UPDATE accounts SET strikes = ? WHERE user_id = ?`, [strikes, userId]);
      
      // Sender sees their own message normally (or we can inject a warning after)
      socket.emit('receive_message', { 
        senderId: socket.id, 
        originalText: text, 
        translatedText: text 
      });

      if (strikes >= 5) {
        socket.emit('sender_restricted');
        blockedUsers.add(userId);
        
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
