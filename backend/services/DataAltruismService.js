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
const analyzeTranscript = async (messages) => {
  if (!messages || messages.length === 0) return;

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

    const jsonResponse = JSON.parse(response.text);
    
    // Insert into DB
    db.run(
      `INSERT INTO research_trends (primary_trigger, root_cause_theme, resolution_state) VALUES (?, ?, ?)`,
      [jsonResponse.primary_trigger, jsonResponse.root_cause_theme, jsonResponse.resolution_state],
      function (err) {
        if (err) {
          console.error("Failed to insert research trend", err);
        } else {
          console.log(`Research trend saved. ID: ${this.lastID}`);
        }
      }
    );
  } catch (error) {
    console.error("Error analyzing transcript with LLM", error);
  }
};

module.exports = {
  analyzeTranscript
};
