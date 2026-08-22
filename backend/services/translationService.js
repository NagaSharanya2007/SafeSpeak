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
        // Free MyMemory API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.responseData && response.data.responseData.translatedText) {
            return response.data.responseData.translatedText;
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
