/**
 * SafeSpeak AI Empathy Copilot Service
 * Connects to Google Gemini API for real-time, context-aware empathetic dialogue.
 */

const axios = require('axios');

const SYSTEM_INSTRUCTION = `You are SafeSpeak's Empathy Copilot — a warm, compassionate, supportive, and active-listening companion.
Your mission is to help people navigate difficult emotions, loneliness, anxiety, and overwhelm.
Guidelines:
1. Actively listen and respond directly to the specific details the user shares (e.g., failing an exam, relationship breakup, grief, loneliness, fear of tomorrow).
2. Validate their emotions with genuine empathy and warmth — never dismiss or minimize their feelings.
3. Keep responses concise (2 to 4 sentences max), comforting, conversational, and natural.
4. Help with gentle grounding, taking things one step at a time, or suggesting simple comfort actions.
5. If the user expresses deep hopelessness or despair, warmly encourage them that they don't have to carry this alone and gently suggest reaching out to a trusted loved one or professional support (such as Tele-MANAS 14416 or 988).
6. Never provide medical diagnoses, clinical therapy claims, or any instructions related to self-harm.`;

/**
 * Generates an empathetic AI response using Google Gemini API.
 * @param {Array<{sender: string, text: string}>} conversationHistory
 * @param {string} userMessage
 * @returns {Promise<string>} AI-generated supportive response
 */
async function generateEmpathyResponse(conversationHistory = [], userMessage = '') {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    try {
      // Build multi-turn contents for Gemini REST API
      const contents = [];

      // Add conversation history
      if (Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-8)) {
          if (!msg.text) continue;
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }

      // Add the latest user message if not already the last item
      if (userMessage && userMessage.trim()) {
        const lastMsg = contents[contents.length - 1];
        if (!lastMsg || lastMsg.role !== 'user' || lastMsg.parts[0].text !== userMessage) {
          contents.push({
            role: 'user',
            parts: [{ text: userMessage.trim() }]
          });
        }
      }

      // If contents is empty, add user message
      if (contents.length === 0) {
        contents.push({
          role: 'user',
          parts: [{ text: userMessage || "Hello" }]
        });
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
            topP: 0.95
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate && candidate.trim()) {
        console.log(`[Empathy Copilot AI]: Generated real Google AI response for query "${userMessage.slice(0, 30)}..."`);
        return candidate.trim();
      }
    } catch (err) {
      console.error("[Empathy Copilot Google AI Error]:", err.response?.data?.error?.message || err.message);
    }
  }

  // Contextual Dynamic Fallback (if API key not configured or network error)
  return getContextualFallbackResponse(userMessage);
}

/**
 * Intelligent contextual fallback that generates dynamic responses based on what the user actually said.
 */
function getContextualFallbackResponse(userMessage = '') {
  const msg = (userMessage || '').toLowerCase();

  if (/^(hi|hey|hello|good (morning|evening|afternoon)|sup|yo)\b/i.test(msg.trim())) {
    return "Hello, I'm really glad you reached out. I'm right here with you. How are you feeling in this moment?";
  }

  if (/\b(exam|test|grade|school|college|study|failed|fail|marks)\b/i.test(msg)) {
    return "Failing or struggling with an exam feels so disheartening and stressful, but please remember that a single score does not define your worth or your future. Give yourself permission to breathe right now. What's weighing on your mind the most about it?";
  }

  if (/\b(nobody|no one|lonely|alone|isolated|friendless|left out)\b/i.test(msg)) {
    return "Feeling like nobody understands or that you're entirely on your own is deeply painful. But your feelings are valid, and you don't have to carry this isolation all by yourself. Can we sit together for a moment and talk about what's making you feel this way?";
  }

  if (/\b(scared|afraid|anxious|anxiety|panic|tomorrow|future|nervous|worry|worried)\b/i.test(msg)) {
    return "It is completely understandable to feel scared or anxious when facing uncertainty about tomorrow. Let's ground ourselves in right now — take a slow, deep breath with me. What is one small thing within your control today?";
  }

  if (/\b(tired|exhausted|give up|giving up|can't do this|done with everything)\b/i.test(msg)) {
    return "I hear how exhausted you are after carrying so much weight for so long. You don't have to figure everything out right this second. Just focus on getting through this gentle moment. What would help you feel even a tiny bit safer or calmer right now?";
  }

  if (/\b(sad|crying|depressed|hopeless|hurt|hurting|heartbroken|breakup)\b/i.test(msg)) {
    return "I'm so sorry you're hurting right now. It takes so much strength to acknowledge how much pain you're feeling. I'm listening with an open heart. Would you like to tell me more about what happened?";
  }

  return `Thank you for sharing that with me. It takes real courage to open up, and I'm listening closely. What feels like the most overwhelming part of what you're experiencing right now?`;
}

module.exports = {
  generateEmpathyResponse,
  SYSTEM_INSTRUCTION
};
