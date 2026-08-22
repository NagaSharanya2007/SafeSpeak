# 🌿 SafeSpeak

**SafeSpeak** is an anonymous, real-time peer support platform designed to provide a safe space for individuals to discuss their struggles without fear of judgment, language barriers, or privacy breaches.

Built for the hackathon, SafeSpeak incorporates state-of-the-art AI and NLP to not only protect users in real-time but also to passively generate invaluable, zero-PII academic research data on psychological trends.

---

## ✨ Key Features

### 🛡️ 1. Absolute Privacy (PII Scrubber)
SafeSpeak uses Natural Language Processing (`compromise` NLP) and advanced Regex to instantly scrub Personally Identifiable Information (PII) before it ever reaches the recipient.
*   **What it blocks:** Names, Emails, Phone Numbers, and Passwords.
*   **Example:** `"Hi, my name is John and my number is 555-1234"` becomes `"Hi, my name is [NAME] and my number is [PHONE]"`.

### 🌍 2. Universal Connection (Real-Time Auto-Translation)
Powered by the Google Cloud Translation API, SafeSpeak detects the user's language and translates incoming messages instantly. Two people speaking entirely different languages can provide peer support to each other as if they were fluent in the same tongue.

### 🛑 3. Anti-Bullying Shield
A built-in moderation layer scans messages for toxic or abusive language.
*   Offending messages are immediately blocked and replaced with `[MESSAGE BLOCKED FOR TOXICITY]`.
*   The sender receives a **strike**. If a user accumulates 5 strikes, they are permanently banned from the platform.

### 🧠 4. "Data Altruism" Engine (Powered by Gemini API)
Every conversation is an opportunity to learn about mental health trends. SafeSpeak turns anonymous chats into a powerful research tool without sacrificing user privacy.
*   **Zero-PII Storage:** When a chat room closes, the fully masked, scrubbed transcript is securely saved to the database.
*   **AI Extraction:** Researchers can run the extraction tool, which feeds the scrubbed transcripts to **Google Gemini 2.5 Pro**.
*   **Clinical Summaries:** The LLM generates a detailed clinical summary, identifying the `Primary Trigger`, `Root Cause Theme`, and `Resolution State`.

### 📊 5. Dedicated Researcher Portal
A sleek dashboard built for sociologists and mental health researchers.
*   View all AI-generated clinical summaries.
*   Expand records to view the **Raw Masked Transcripts** right alongside the AI's analysis for ultimate transparency.
*   **Chief Data Scientist AI:** Click the "Generate Global Summary" button to have Gemini analyze the *entire* platform's history and output a macro-level paragraph on overarching mental health trends.
*   Download datasets directly as JSON files.

---

## 🛠️ Tech Stack

*   **Frontend:** React, Vite, TailwindCSS (Earthy Wellness Theme), Lucide Icons.
*   **Backend:** Node.js, Express, Socket.io (Real-time WebSockets), SQLite3.
*   **AI & APIs:** `@google/genai` (Gemini 2.5 Pro), `@google-cloud/translate`, `compromise` (NLP).

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (v18+)
*   Google Gemini API Key
*   Google Cloud Translation API Credentials

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

*Designed and engineered to make peer support safe, accessible, and scientifically valuable.*
