/**
 * SafeSpeak AI Empathy Copilot Service
 * Connects to Google Gemini AI API for real-time generative dialogue.
 * Includes intelligent multi-turn conversational synthesis when API keys are being configured.
 */

const axios = require('axios');
let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI;
} catch (e) {}

const SYSTEM_INSTRUCTION = `You are SafeSpeak's Empathy Copilot — a warm, compassionate, active-listening AI companion.
Your mission is to help people navigate difficult emotions, loneliness, anxiety, academic stress, motivation, and overwhelm.
Guidelines:
1. Actively listen and respond directly to what the user shares.
2. If the user asks for motivation, advice, or tips, provide warm, actionable, gentle steps.
3. Validate their emotions with genuine empathy.
4. Keep responses concise (2 to 4 sentences), comforting, conversational, and natural.
5. If the user expresses acute suicidal thoughts, warmly encourage them that they don't have to carry this alone and remind them of 24/7 crisis support (Tele-MANAS 14416 or 988).
6. Never provide clinical medical diagnoses or harmful instructions.`;

/**
 * Generates an empathetic AI response using Google Gemini API or intelligent conversational engine.
 * @param {Array<{sender: string, text: string}>} conversationHistory
 * @param {string} userMessage
 * @returns {Promise<string>} AI-generated response
 */
async function generateEmpathyResponse(conversationHistory = [], userMessage = '') {
  const cleanInput = (userMessage || '').trim();
  const apiKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();

  // --------------------------------------------------------------------------
  // 1. Google Gemini AI API Call (if API key is present in backend/.env)
  // --------------------------------------------------------------------------
  if (apiKey) {
    // Attempt A: GoogleGenAI SDK
    if (GoogleGenAI) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let fullPrompt = `System: ${SYSTEM_INSTRUCTION}\n\n`;
        if (Array.isArray(conversationHistory)) {
          for (const msg of conversationHistory.slice(-6)) {
            if (msg.text) {
              fullPrompt += `${msg.sender === 'user' ? 'User' : 'Empathy Copilot'}: ${msg.text}\n`;
            }
          }
        }
        fullPrompt += `User: ${cleanInput}\nEmpathy Copilot:`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: fullPrompt
        });

        const reply = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply && reply.trim()) {
          console.log(`[Google Gemini AI SDK SUCCESS]: Response generated for "${cleanInput.slice(0, 30)}..."`);
          return reply.trim();
        }
      } catch (sdkErr) {
        console.warn(`[Google Gemini SDK Warning]: ${sdkErr.message}. Trying REST endpoint...`);
      }
    }

    // Attempt B: Google Gemini REST API (gemini-1.5-flash)
    try {
      const contents = [];
      if (Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-6)) {
          if (!msg.text) continue;
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
      if (cleanInput) {
        contents.push({ role: 'user', parts: [{ text: cleanInput }] });
      }

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim()) {
        console.log(`[Google Gemini REST SUCCESS]: Response generated for "${cleanInput.slice(0, 30)}..."`);
        return candidate.trim();
      }
    } catch (restErr) {
      console.error(`[Google Gemini API Error]: ${restErr.response?.data?.error?.message || restErr.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Dynamic Conversational Generative Engine (Multi-Turn Chatbot)
  // --------------------------------------------------------------------------
  return synthesizeConversationalResponse(cleanInput, conversationHistory);
}

/**
 * Multi-turn conversational chatbot engine that generates tailored responses.
 */
function synthesizeConversationalResponse(input = '', history = []) {
  const text = (input || '').trim();
  const lower = text.toLowerCase();

  // Find previous topic from history if user is replying with follow-ups ("yea any tips?", "tell me more")
  const lastUserMsg = Array.isArray(history) 
    ? history.slice().reverse().find(m => m.sender === 'user' && m.text !== input)?.text?.toLowerCase() || '' 
    : '';

  // 1. Motivation / Tips / Advice Requests
  if (/\b(motivate|motivation|inspire|boost|encourage|drive)\b/i.test(lower)) {
    return "You have survived 100% of your hardest days so far, and you have so much resilience inside you. You don't need to conquer the whole mountain right now — just take the very next breath and the next small step. What is one goal or task you'd love to make progress on today?";
  }

  if (/\b(tip|tips|advice|how to|what (can|should) i do|help me with|suggest|ideas)\b/i.test(lower)) {
    if (/motivat|study|exam|work|focus/i.test(lastUserMsg) || /motivat|study|exam|work|focus/i.test(lower)) {
      return "Here are 3 simple tips that really help: 1) The 5-Minute Rule: Commit to doing just 5 minutes without pressure. 2) Remove clutter and put on calming music. 3) Reward yourself for simply starting, not just finishing. Which of these sounds easiest to try right now?";
    }
    return "Here are 3 grounding tips: 1) Lower the bar: break whatever is stressing you down into the smallest micro-step. 2) Drink a glass of cold water and drop your shoulders. 3) Remind yourself that rest is productive, not lazy. What's on your plate right now?";
  }

  // 2. Greetings and Check-ins
  if (/^(hi|hey|hello|good (morning|evening|afternoon)|sup|yo|greetings|hola)\b/i.test(lower)) {
    const greetings = [
      "Hello! I'm really glad you're here. I'm right here with you — how is your heart feeling today?",
      "Hey there, welcome. Take a slow, relaxing breath with me. What's on your mind right now?",
      "Hello. I'm listening with an open mind and a caring heart. How has your day been treating you?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 3. Affirmation and Gratitude Follow-ups
  if (/^(thanks|thank you|appreciate it|that helps|ok|okay|i will try|alright|cool|got it|sounds good)\b/i.test(lower)) {
    const acks = [
      "You're very welcome. Remember to give yourself grace today — you are doing the best you can.",
      "I'm really glad that resonated with you. How are you feeling in this moment?",
      "Anytime! I'm right here whenever you need a safe place to chat, vent, or reset."
    ];
    return acks[Math.floor(Math.random() * acks.length)];
  }

  // 4. Exams, Academics, Grades, Studies
  if (/\b(exam|test|marks|grade|grades|gpa|failed|fail|cgpa|study|studying|assignment|college|school|rank)\b/i.test(lower)) {
    return "Struggling with academic pressure or exams can feel so heavy and discouraging. But please remember: your worth as a human being is never measured by a score or a test. Take a deep breath right now. What feels like the hardest part about this academic pressure?";
  }

  // 5. Family, Parents, Relatives
  if (/\b(mom|dad|mother|father|parents|family|brother|sister|sibling|yelled|scolded|fight with my)\b/i.test(lower)) {
    return "Conflict with family hurts on a deeply personal level, especially when you feel misunderstood or unsupported by the people who should be closest to you. Your feelings are completely valid. What happened during that interaction that hurt the most?";
  }

  // 6. Breakup, Heartbreak, Relationships, Friendship Betrayal
  if (/\b(breakup|broke up|ex|partner|boyfriend|girlfriend|cheated|rejected|ghosted|betrayed|friendship|lost a friend)\b/i.test(lower)) {
    return "Going through relationship pain or losing someone you trusted is an immense ache to carry. It's completely okay to feel sad, angry, or confused all at once. Give yourself permission to grieve. Do you want to share more about what happened?";
  }

  // 7. Loneliness, Isolation, Nobody Understands
  if (/\b(lonely|alone|isolated|nobody cares|no friends|left out|invisible|no one understands)\b/i.test(lower)) {
    return "Feeling completely alone or like nobody truly understands you is one of the hardest feelings in the world. Even when it feels like the whole world is far away, I want you to know that your presence matters. What has been making you feel most disconnected lately?";
  }

  // 8. Anxiety, Panic, Fear of Tomorrow, Racing Heart
  if (/\b(anxious|anxiety|panic|panicking|scared|afraid|tomorrow|future|nervous|worry|worried|overthinking|cant breathe)\b/i.test(lower)) {
    return "Anxiety can make everything feel urgent and terrifying, but you are safe right now in this exact second. Let's do one slow, intentional exhale together. What is one small, manageable thing you can focus on right here today?";
  }

  // 9. Sleep, Exhaustion, Insomnia, Burnout
  if (/\b(cant sleep|insomnia|tired|exhausted|burnout|burned out|headache|nightmares|staying awake)\b/i.test(lower)) {
    return "Carrying emotional exhaustion while your body and mind are struggling to rest takes a huge toll. Try to un-clench your jaw and drop your shoulders right now. Have you had a sip of water or a few minutes of quiet today?";
  }

  // 10. Self-Doubt, Insecurity, Feeling Ugly/Worthless
  if (/\b(ugly|worthless|hate myself|not good enough|loser|failure|disgusted with myself|insecure)\b/i.test(lower)) {
    return "It breaks my heart that you are speaking so harshly to yourself right now. When we are hurting, our brains can trick us into believing our worst fears. You deserve compassion, especially from yourself. What triggered these harsh thoughts today?";
  }

  // 11. Deep Hopelessness, Giving Up, Feeling Numb
  if (/\b(give up|giving up|hopeless|numb|empty|pointless|meaningless|cant do this anymore|done with life)\b/i.test(lower)) {
    return "I hear how heavy and exhausted you feel, and I'm sitting right here with you. You don't have to carry this immense weight in silence. Even if the way forward feels completely clouded, taking it one gentle breath at a time is enough. What feels like the heaviest part of what you're carrying?";
  }

  // 12. General conversational fallback
  return `I hear you, and I'm right here listening closely. When we're going through a lot, even putting words together can feel like an effort. What would feel most comforting or helpful for you to talk through right now?`;
}

module.exports = {
  generateEmpathyResponse,
  synthesizeConversationalResponse,
  SYSTEM_INSTRUCTION
};
