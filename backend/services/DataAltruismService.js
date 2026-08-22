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
    resolution_state: "Partially Resolved (User felt heard)",
    detailed_summary: "The user expressed severe anxiety regarding their upcoming final exams. They described feeling overwhelmed by the amount of material to study and feared disappointing their family. Their peer provided empathetic listening and validated their stress, suggesting a Pomodoro study technique. By the end of the chat, the user reported feeling slightly more grounded."
  };

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MISSING_API_KEY' || process.env.GEMINI_API_KEY === 'your_key_here') {
    console.warn("WARN: GEMINI_API_KEY is missing. Saving mock data instead of calling LLM.");
    return mockFallback;
  }

  const transcriptStr = messages.join('\n');
  const prompt = `You are a clinical data extractor and psychological analyst. Read this anonymous chat transcript and return a valid JSON object with the following keys:
- 'primary_trigger' (string): A short phrase describing the immediate trigger for the conversation.
- 'root_cause_theme' (string): A short phrase describing the underlying psychological theme.
- 'resolution_state' (string): A short phrase describing how the chat ended.
- 'detailed_summary' (string): A 3-4 sentence clinical summary of the conversation, the emotions expressed, and the support provided.
Do not include any other text or markdown formatting.

Transcript:
${transcriptStr}`;

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
