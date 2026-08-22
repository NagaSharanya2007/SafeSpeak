const axios = require('axios');

/**
 * AI / Translation API integration wrapper (Phase 2)
 */
const translateText = async (text, sourceLanguage, targetLanguage) => {
    // If languages match, bypass translation entirely
    if (sourceLanguage === targetLanguage || !sourceLanguage || !targetLanguage) {
        return text;
    }
    
    try {
        // Use Google Translate Unofficial API
        const safeTarget = targetLanguage === 'hinglish' ? 'hi' : targetLanguage;
        const safeSource = sourceLanguage === 'hinglish' ? 'hi' : sourceLanguage;

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${safeSource}&tl=${safeTarget}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url);
        
        if (response.data && response.data[0]) {
            // Map over chunks to support multi-sentence messages
            return response.data[0].map(chunk => chunk[0]).join('');
        }
        return text;
    } catch (error) {
        console.error("Translation API Error:", error.message);
        // Fallback safely to original text
        return text;
    }
};

module.exports = {
    translateText
};
