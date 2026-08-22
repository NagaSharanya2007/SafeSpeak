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

/**
 * Generates a global summary report from all individual reports
 */
async function generateGlobalReport(reports) {
  if (!reports || reports.length === 0) return "No data available to generate a global report.";

  const mockGlobal = "Based on the recent influx of anonymous chats, the platform is seeing a significant spike in academic anxiety, primarily driven by upcoming final exams. Users frequently express feelings of being overwhelmed and fear of disappointing their families. Peer interventions that validate these feelings and offer structured advice (like study techniques) have shown high resolution rates, leaving users feeling more grounded.";

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MISSING_API_KEY' || process.env.GEMINI_API_KEY === 'your_key_here') {
    return mockGlobal;
  }

  const reportsStr = reports.map(r => `Trigger: ${r.primary_trigger} | Theme: ${r.root_cause_theme} | Resolution: ${r.resolution_state}`).join('\n');
  const prompt = `You are a Chief Data Scientist analyzing psychological trends across a student support platform. Read the following individual chat reports and generate a single, cohesive 1-2 paragraph global summary of the overarching trends, common struggles, and the effectiveness of peer support on the platform right now.

Individual Reports:
${reportsStr}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt
    });

    return response.text();
  } catch (error) {
    console.error("Error generating global report with LLM.", error);
    return mockGlobal;
  }
}

module.exports = {
  analyzeTranscript,
  generateGlobalReport
};
