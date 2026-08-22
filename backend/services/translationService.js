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
        // Let Google auto-detect the source language to be perfectly robust
        const safeSource = 'auto';

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${safeSource}&tl=${safeTarget}&dt=t&q=${encodeURIComponent(text)}`;
        
        console.log(`[Translation] Attempting: ${text} -> to ${safeTarget}`);
        const response = await axios.get(url);
        
        if (response.data && response.data[0]) {
            // Map over chunks to support multi-sentence messages
            const result = response.data[0].map(chunk => chunk[0]).join('');
            console.log(`[Translation Success]: ${result}`);
            return result;
        }
        return text;
    } catch (error) {
        console.error("[Translation API Error]:", error.message);
        // Fallback safely to original text
        return text;
    }
};

module.exports = {
    translateText
};
