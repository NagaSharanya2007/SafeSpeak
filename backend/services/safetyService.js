/**
 * SafeSpeak Safety & Risk Detection Service
 * Robust, Context-Aware, Multilingual Suicide Risk & Harmful Message Classifier
 */

// Normalized text helper (removes noise, handles contractions, preserves unicode letters)
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/['’`]/g, '') // remove apostrophes: i'm -> im, don't -> dont
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[+]/g, 't')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --------------------------------------------------------------------------
// 1. HARMFUL & BULLYING MESSAGE DETECTION
// --------------------------------------------------------------------------

const HARMFUL_PATTERNS = [
  /\b(you(re| are)? (an? )?(ugly|stupid|idiot|moron|loser|worthless|pathetic|trash|retard|fat|bitch|bastard|asshole|whore|slut))\b/i,
  /\b(shut up (you|bitch|idiot|retard))\b/i,
  /\b(get lost you (idiot|loser|bitch))\b/i,
  /\b(nobody likes you|nobody loves you|everyone hates you|you have no friends)\b/i,
  /\b(kill your\s*self|go die|go kill yourself|drink bleach|jump off a bridge)\b/i,
  /\b(you deserve to die|you should die|die in a fire)\b/i,
  /\b(f\*ck you|fuck off|fck you|piece of shit|motherfucker|cunt|dickhead|jackass)\b/i,
  /\b(i (will|am going to|gonna|want to|plan to|ll) ([a-z\s]{0,15} )?(kill|beat|hurt|destroy|stab|shoot|strangle|harm|murder|punch|attack) you)\b/i,
  /\b(i(ll| will) (hunt you down|make you pay|ruin you|break your face)|watch your back)\b/i,
  /\b(chutiya|kamina|kamine|bhenchod|madarchod|harami|bhosdike|gandu|randi)\b/i,
  /\b(kukka|vedhava|dongana|pichi|dhedh|lanja|munda|donga)\b/i,
  /\b(tera murder|tujhe maar dunga|champesta|champesthuna|champesthara)\b/i,
  /(కుక్క|వెధవ|లంజ|ముండ|పిచ్చి|చంపేస్తా|చంపేస్తాను|దొంగ)/iu
];

function checkHarmfulContent(originalText, translatedText = '') {
  const normOriginal = normalizeText(originalText);
  const normTranslated = normalizeText(translatedText);
  const combined = `${normOriginal} ${normTranslated} ${originalText} ${translatedText}`;

  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(originalText) || pattern.test(normOriginal) || 
        pattern.test(translatedText) || pattern.test(normTranslated) ||
        pattern.test(combined)) {
      return {
        isHarmful: true,
        category: 'bullying_harassment',
        reason: 'Message contains potentially abusive, bullying, or threatening language.'
      };
    }
  }

  return {
    isHarmful: false,
    category: 'safe',
    reason: ''
  };
}

// --------------------------------------------------------------------------
// 2. SUICIDE RISK & SELF-HARM CLASSIFIER (LOW, MEDIUM, HIGH / IMMINENT)
// --------------------------------------------------------------------------

const CONTEXT_EXEMPTIONS = [
  /\b(movie|film|documentary|book|article|show|news|story|class|lecture|exam|study) (about|on|regarding) (suicide|depression|death)\b/i,
  /\b(what is|definition of|meaning of|explain|preventing|prevention of) (suicide|depression)\b/i,
  /\b(how to prevent|suicide prevention|awareness|helpline|support group)\b/i,
  /\b(glad (im|i am|i was) alive|dont want to die|no longer suicidal|feeling better today)\b/i,
  /(ఆత్మహత్య నివారణ|ఆత్మహత్యల గురించి|ఆత్మహత్య అంటే ఏమిటి|ఆత్మహత్య పై సినిమా|ఆత్మహత్య పై వార్త)/iu
];

const HIGH_IMMINENT_PATTERNS = [
  // English explicit statements of suicide, ending life, killing oneself, or immediacy
  /\b(i|im|i am)?\s*(going to|gonna|will|plan to|want to|need to|about to|decided to|ready to)\s*(kill myself|commit suicide|end my life|end it all|take my life|hang myself|shoot myself|slit my wrists|overdose|die tonight|do it tonight)\b/i,
  /\b(kill myself|commit suicide|end my life|take my own life)\b/i,
  /\b(i|im|i am)\s*(killing myself|ending it all|ending my life|dying tonight|done with life)\b/i,
  /\b(tonight is (my last night|the night i die|the end))\b/i,
  /\b(wrote my (suicide note|goodbye letter)|goodbye forever,? im (leaving|ending it|done))\b/i,
  /\b(going to jump off|swallow(ing)? all (my|these)? pills|swallowing pills to die)\b/i,
  /\b(tell me how to (kill myself|die|commit suicide|end my life))\b/i,
  /\b((what is|easiest|best|painless|fastest) way to (die|kill myself|commit suicide))\b/i,

  // Telugu Native Script Explicit Intent
  /(చచ్చిపోతా|చచ్చిపోతాను|చనిపోతాను|చనిపోవాలనుకుంటున్నాను|చనిపోవాలని ఉంది|చచ్చిపోవాలని ఉంది)/iu,
  /(ఆత్మహత్య చేసుకుంటా|ఆత్మహత్య చేసుకుంటాను|ఆత్మహత్య చేసుకోబోతున్నా|ఆత్మహత్య చేసుకోబోతున్నాను|ఆత్మహత్య)/iu,
  /(నన్ను నేను చంపుకుంటా|నన్ను నేను చంపుకుంటాను|ప్రాణాలు తీసుకుంటా|ప్రాణాలు తీసుకుంటాను)/iu,
  /(ఈ రాత్రికి (చచ్చిపోతా|చనిపోతా|అయిపోతుంది)|ఈ రోజే చచ్చిపోతా|చనిపోవడానికి సులభమైన మార్గం)/iu,
  /(ఎలా చనిపోవాలి|ఎలా చావాలి|ఎలా ఆత్మహత్య చేసుకోవాలి)/iu,

  // Telugu Transliterated
  /\b(chachipotha|chachipothanu|chanipothanu|chanipovali ani undi|chachipovali ani undi)\b/i,
  /\b(aathma hathya|aathmahathya|champukunta|ee rathriki chachipotha)\b/i,

  // Hindi Native & Transliterated
  /(मर जाऊंगा|मर जाऊँगा|आत्महत्या کروں گا|आत्महत्या कर लूंगा|खुद को मार लूंगा|अपनी जान दे दूंगा|आज रात मर जाऊंगा)/iu,
  /\b(mar jaunga|mar jaungi|aatmhatya kar lunga|khud ko maar dunga|jaan de dunga|aaj raat mar jaunga)\b/i
];

const MEDIUM_CONCERNING_PATTERNS = [
  // English Concerning
  /\b(i|im|i am)?\s*(want to|wanna|feel like|wish i could|thinking of|thinking about)\s*(die|dying|disappear|give up|giving up|stop existing|sleep forever|never wake up|not wake up)\b/i,
  /\b(dont (want to|wanna) (be here|live|exist) anymore)\b/i,
  /\b(dont think i can (keep going|do this anymore|make it|take this anymore))\b/i,
  /\b(cant (keep going|go on|take this|handle this) anymore)\b/i,
  /\b(feel like giving up|giving up on everything|giving up on life)\b/i,
  /\b(everyone (would be|is) better off without me|nobody cares if i die)\b/i,
  /\b(no reason to live|nothing left (to live for|for me)|life is meaningless and im done)\b/i,
  /\b(wish i (was|were) (never born|dead))\b/i,
  /\b(feeling (completely|totally) hopeless|drowning in despair|i feel so broken)\b/i,

  // Telugu Native Concerning
  /(నాకు బ్రతకాలని లేదు|బ్రతకాలనిపించడం లేదు|జీవించాలని లేదు|జీవితం విసుగొచ్చింది)/iu,
  /(నేను భరించలేకపోతున్నా|నేను తట్టుకోలేకపోతున్నా|అందరికీ నేను భారం|బ్రతకడం వేస్ట్)/iu,
  /(జీవితంపై ఆశ పోయింది|నా జీవితం ముగిసిపోయింది|ఎందుకు బ్రతకాలో తెలియడం లేదు)/iu,

  // Telugu Transliterated
  /\b(brathakalani ledu|jeevinchalani ledu|jeevitham visugochindi|bharinchalekapothunna)\b/i,
  /\b(andariki nenu bharam|brathakadam waste|enduku brathakalo theliyatledu)\b/i,

  // Hindi
  /(जीने की इच्छा नहीं है|जीना नहीं चाहता|सब खत्म हो गया|जीना बेकार है)/iu,
  /\b(jeene ki iccha nahi|jeena nahi chahta|sab khatam ho gaya|jeena bekaar hai)\b/i
];

const LOW_DISTRESS_PATTERNS = [
  /\b(feeling (really )?(low|sad|down|blue|depressed|lonely|exhausted|overwhelmed|burnt out))\b/i,
  /\b(having a (hard|tough|bad|terrible) (day|time|week))\b/i,
  /\b(crying (all day|nonstop)|i cant stop crying)\b/i,
  /\b(nobody understands me|feel so alone|isolated and sad)\b/i,
  /\b(so (stressed|anxious|tired of everything))\b/i,

  /(చాలా బాధగా ఉంది|ఒంటరిగా అనిపిస్తోంది|అలసిపోయాను|చాలా కష్టంగా ఉంది|ఏడుపొస్తోంది)/iu,
  /\b(chala badhaga undi|ontariga anipisthondi|alasipoyanu|chala kashtanga undi)\b/i,

  /(बहुत उदास हूं|अकेलापन महसूस हो रहा है|थक गया हूं|रोना आ रहा है)/iu,
  /\b(bahut udaas hu|akelapan lag raha hai|thak gaya hu|rona aa raha hai)\b/i
];

function checkSuicideRisk(originalText, translatedText = '', conversationHistory = []) {
  const normOriginal = normalizeText(originalText);
  const normTranslated = normalizeText(translatedText);
  const textToCheck = `${originalText} ${translatedText} ${normOriginal} ${normTranslated}`;

  // 1. Check for educational or media exemptions
  for (const exemptPattern of CONTEXT_EXEMPTIONS) {
    if (exemptPattern.test(originalText) || exemptPattern.test(translatedText) || exemptPattern.test(normOriginal) || exemptPattern.test(textToCheck)) {
      return {
        riskLevel: 'NORMAL',
        reason: 'Educational, media, or general discussion.'
      };
    }
  }

  // 2. Check for High / Imminent Risk
  for (const highPattern of HIGH_IMMINENT_PATTERNS) {
    if (highPattern.test(originalText) || highPattern.test(translatedText) || highPattern.test(normOriginal) || highPattern.test(textToCheck)) {
      return {
        riskLevel: 'HIGH_IMMINENT',
        reason: 'Explicit statement of suicidal intent, plan, or immediacy detected.'
      };
    }
  }

  // 3. Check for Medium / Concerning Emotional Distress
  for (const concernPattern of MEDIUM_CONCERNING_PATTERNS) {
    if (concernPattern.test(originalText) || concernPattern.test(translatedText) || concernPattern.test(normOriginal) || concernPattern.test(textToCheck)) {
      return {
        riskLevel: 'CONCERNING',
        reason: 'Expressions of deep hopelessness, distress, or thoughts of ending life detected.'
      };
    }
  }

  // 4. Check for Low Risk / Mild Emotional Distress
  for (const lowPattern of LOW_DISTRESS_PATTERNS) {
    if (lowPattern.test(originalText) || lowPattern.test(translatedText) || lowPattern.test(normOriginal) || lowPattern.test(textToCheck)) {
      return {
        riskLevel: 'LOW',
        reason: 'Mild emotional distress, sadness, or fatigue detected.'
      };
    }
  }

  return {
    riskLevel: 'NORMAL',
    reason: 'Standard conversational content.'
  };
}

module.exports = {
  checkHarmfulContent,
  checkSuicideRisk,
  normalizeText
};
