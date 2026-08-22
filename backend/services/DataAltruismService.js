const { GoogleGenAI } = require('@google/genai');
const db = require('../database');
require('dotenv').config();

// Ensure the GEMINI_API_KEY is available
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY' // Fallback for local testing if not set
});

/**
 * Analyzes a chat transcript and extracts synthetic trends.
 * @param {Array<string>} messages - Array of masked text messages
 */
async function analyzeTranscript(messages) {
  if (!messages || messages.length === 0) return;

  // Mock data fallback if API key is missing or invalid
  const mockFallback = {
    primary_trigger: "Academic Pressure",
    root_cause_theme: "Upcoming Final Exams",
    resolution_state: "Partially Resolved (User felt heard)"
  };

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MISSING_API_KEY' || process.env.GEMINI_API_KEY === 'your_key_here') {
    console.warn("WARN: GEMINI_API_KEY is missing. Saving mock data instead of calling LLM.");
    return mockFallback;
  }

  const transcriptStr = messages.join('\n');
  const prompt = `You are a clinical data extractor. Read this anonymous chat transcript and return a valid JSON object with the keys: 'primary_trigger' (string), 'root_cause_theme' (string), and 'resolution_state' (string). Do not include any conversational text.\n\nTranscript:\n${transcriptStr}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing transcript with LLM. Saving mock data.", error);
    return mockFallback;
  }
};

module.exports = {
  analyzeTranscript
};
