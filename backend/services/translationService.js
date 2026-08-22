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
        
        console.log(`[Translation] Attempting Google: ${text} -> to ${safeTarget}`);
        const response = await axios.get(url);
        
        if (response.data && response.data[0]) {
            // Map over chunks to support multi-sentence messages
            const result = response.data[0].map(chunk => chunk[0]).join('');
            console.log(`[Translation Success - Google]: ${result}`);
            return result;
        }
        return text;
    } catch (error) {
        console.warn("[Translation API Error - Google]:", error.message, "Falling back to MyMemory API...");
        
        try {
            // Fallback to MyMemory API if Google is rate limited
            const safeTarget = targetLanguage === 'hinglish' ? 'hi' : targetLanguage;
            const memoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|${safeTarget}`;
            
            const memResponse = await axios.get(memoryUrl);
            if (memResponse.data && memResponse.data.responseData && memResponse.data.responseData.translatedText) {
                const memResult = memResponse.data.responseData.translatedText;
                console.log(`[Translation Success - MyMemory]: ${memResult}`);
                return memResult;
            }
        } catch (memError) {
            console.error("[Translation API Error - MyMemory]:", memError.message);
        }
        
        // Fallback safely to original text if both fail
        return text;
    }
};

module.exports = {
    translateText
};
