import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Gemini API Configuration
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// OpenAI API Configuration
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Call Gemini AI API (Free tier: 60 requests/minute)
 * @param {string} question - User question
 * @param {string} language - Language code
 * @returns {object} AI response
 */
async function callGeminiAI(question, language) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const langNames = { en: "English", hi: "Hindi", mr: "Marathi", kn: "Kannada" };
    const langName = langNames[language] || "English";

    const prompt = `You are an expert Indian Agriculture Assistant. Answer the farmer's question in ${langName} language.

Farmer's Question: ${question}

Provide a helpful, practical answer focused on Indian farming conditions. Include specific advice when possible. Keep the response concise (2-3 sentences) and farmer-friendly.

If the question is about:
- Crop diseases: Describe symptoms and suggest organic/chemical treatments
- Market prices: Give price ranges for common crops in Indian markets
- Weather: Provide farming advice based on weather conditions
- Fertilizers: Recommend specific NPK ratios and application methods
- General farming: Share best practices and tips

Response in ${langName}:`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    if (response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
      return {
        success: true,
        answer: response.data.candidates[0].content.parts[0].text.trim(),
        source: 'gemini'
      };
    }

    throw new Error("Invalid response from Gemini API");
  } catch (error) {
    console.error("❌ Gemini AI error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Call OpenAI API (Fallback)
 * @param {string} question - User question
 * @param {string} language - Language code
 * @returns {object} AI response
 */
async function callOpenAI(question, language) {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const langNames = { en: "English", hi: "Hindi", mr: "Marathi", kn: "Kannada" };
    const langName = langNames[language] || "English";

    const systemPrompt = `You are an expert Indian Agriculture Assistant. Answer in ${langName} language. Provide practical, farmer-friendly advice for Indian farming conditions. Keep responses concise (2-3 sentences).`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.choices && response.data.choices[0]?.message?.content) {
      return {
        success: true,
        answer: response.data.choices[0].message.content.trim(),
        source: 'openai'
      };
    }

    throw new Error("Invalid response from OpenAI API");
  } catch (error) {
    console.error("❌ OpenAI error:", error.message);
    return { success: false, error: error.message };
  }
}

// AI Chat History Schema
const chatHistorySchema = new mongoose.Schema({
  question: String,
  answer: String,
  language: String,
  timestamp: { type: Date, default: Date.now }
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// AI Chat responses in multiple languages
const AI_RESPONSES = {
  en: {
    greeting: "Hello! I'm your AI Farm Assistant. How can I help you today?",
    disease: "To identify crop diseases, look for symptoms like discolored leaves, spots, wilting, or unusual growth. You can upload a photo for better diagnosis. Common diseases include leaf blight, powdery mildew, and rust.",
    market: "Current market prices vary by location and season. Rice: ₹2000-2500/quintal, Wheat: ₹2500-3000/quintal, Cotton: ₹6000-7000/quintal. Check your local mandi for exact prices.",
    weather: "Weather information is crucial for farming. Check the forecast before irrigation, spraying, or harvesting. Avoid field work during heavy rain or extreme heat.",
    fertilizer: "Fertilizer recommendations depend on your crop and soil type. For most crops: Use NPK 10:26:26 at sowing, Urea during vegetative stage, and Potash-rich fertilizer at flowering.",
    default: "I can help you with crop diseases, market prices, weather information, and fertilizer advice. What would you like to know?"
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    disease: "ಬೆಳೆ ರೋಗಗಳನ್ನು ಗುರುತಿಸಲು, ಬಣ್ಣ ಬದಲಾದ ಎಲೆಗಳು, ಕಲೆಗಳು, ಒಣಗುವಿಕೆ ಅಥವಾ ಅಸಾಮಾನ್ಯ ಬೆಳವಣಿಗೆಯಂತಹ ಲಕ್ಷಣಗಳನ್ನು ನೋಡಿ. ಉತ್ತಮ ರೋಗನಿರ್ಣಯಕ್ಕಾಗಿ ನೀವು ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಬಹುದು.",
    market: "ಪ್ರಸ್ತುತ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು ಸ್ಥಳ ಮತ್ತು ಋತುವಿನ ಪ್ರಕಾರ ಬದಲಾಗುತ್ತವೆ. ಅಕ್ಕಿ: ₹2000-2500/ಕ್ವಿಂಟಾಲ್, ಗೋಧಿ: ₹2500-3000/ಕ್ವಿಂಟಾಲ್. ನಿಖರ ಬೆಲೆಗಳಿಗಾಗಿ ನಿಮ್ಮ ಸ್ಥಳೀಯ ಮಂಡಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    weather: "ಕೃಷಿಗೆ ಹವಾಮಾನ ಮಾಹಿತಿ ಬಹಳ ಮುಖ್ಯ. ನೀರಾವರಿ, ಸಿಂಪಡಿಸುವಿಕೆ ಅಥವಾ ಕೊಯ್ಲಿಗೆ ಮೊದಲು ಮುನ್ಸೂಚನೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    fertilizer: "ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳು ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಮಣ್ಣಿನ ಪ್ರಕಾರವನ್ನು ಅವಲಂಬಿಸಿರುತ್ತದೆ. ಹೆಚ್ಚಿನ ಬೆಳೆಗಳಿಗೆ: ಬಿತ್ತನೆಯ ಸಮಯದಲ್ಲಿ NPK 10:26:26 ಬಳಸಿ.",
    default: "ನಾನು ಬೆಳೆ ರೋಗಗಳು, ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಹವಾಮಾನ ಮಾಹಿತಿ ಮತ್ತು ಗೊಬ್ಬರ ಸಲಹೆಯೊಂದಿಗೆ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು."
  },
  hi: {
    greeting: "नमस्ते! मैं आपका AI कृषि सहायक हूं। मैं आपकी कैसे मदद कर सकता हूं?",
    disease: "फसल रोगों की पहचान करने के लिए, रंग बदले हुए पत्ते, धब्बे, मुरझाना या असामान्य वृद्धि जैसे लक्षणों को देखें। बेहतर निदान के लिए आप फोटो अपलोड कर सकते हैं।",
    market: "वर्तमान बाजार मूल्य स्थान और मौसम के अनुसार भिन्न होते हैं। चावल: ₹2000-2500/क्विंटल, गेहूं: ₹2500-3000/क्विंटल। सटीक कीमतों के लिए अपनी स्थानीय मंडी की जांच करें।",
    weather: "खेती के लिए मौसम की जानकारी बहुत महत्वपूर्ण है। सिंचाई, छिड़काव या कटाई से पहले पूर्वानुमान की जांच करें।",
    fertilizer: "उर्वरक सिफारिशें आपकी फसल और मिट्टी के प्रकार पर निर्भर करती हैं। अधिकांश फसलों के लिए: बुवाई के समय NPK 10:26:26 का उपयोग करें।",
    default: "मैं फसल रोगों, बाजार मूल्यों, मौसम की जानकारी और उर्वरक सलाह के साथ आपकी मदद कर सकता हूं।"
  },
  mr: {
    greeting: "नमस्कार! मी तुमचा AI शेती सहाय्यक आहे. मी तुम्हाला कशी मदत करू शकतो?",
    disease: "पिकांच्या रोगांची ओळख करण्यासाठी, रंग बदललेली पाने, डाग, कोमेजणे किंवा असामान्य वाढ यासारखी लक्षणे पहा. चांगल्या निदानासाठी तुम्ही फोटो अपलोड करू शकता.",
    market: "सध्याच्या बाजार भावा स्थान आणि हंगामानुसार बदलतात. तांदूळ: ₹2000-2500/क्विंटल, गहू: ₹2500-3000/क्विंटल. अचूक किमतीसाठी तुमच्या स्थानिक मंडीची तपासणी करा.",
    weather: "शेतीसाठी हवामान माहिती अत्यंत महत्त्वाची आहे. पाणी देणे, फवारणी किंवा कापणी करण्यापूर्वी अंदाज तपासा.",
    fertilizer: "खताच्या शिफारशी तुमच्या पिकावर आणि मातीच्या प्रकारावर अवलंबून असतात. बहुतेक पिकांसाठी: पेरणीच्या वेळी NPK 10:26:26 वापरा.",
    default: "मी पिकांचे रोग, बाजार भाव, हवामान माहिती आणि खत सल्ला यामध्ये तुम्हाला मदत करू शकतो."
  }
};

// POST: AI Chat endpoint
router.post("/chat", async (req, res) => {
  try {
    const { question, language = 'en' } = req.body;

    // Validation
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: "Question is required and must be a string" 
      });
    }

    console.log(`🤖 AI Chat: "${question}" (language: ${language})`);

    let answer, source;

    // Try Gemini AI first (Free: 60 req/min)
    const geminiResult = await callGeminiAI(question, language);
    if (geminiResult.success) {
      answer = geminiResult.answer;
      source = 'gemini';
      console.log('✅ Gemini AI response received');
    }
    // Fallback to OpenAI
    else if (OPENAI_API_KEY) {
      const openaiResult = await callOpenAI(question, language);
      if (openaiResult.success) {
        answer = openaiResult.answer;
        source = 'openai';
        console.log('✅ OpenAI response received');
      }
    }

    // Final fallback: keyword matching
    if (!answer) {
      console.log('⚠️  Using keyword fallback');
      const responses = AI_RESPONSES[language] || AI_RESPONSES['en'];
      const questionLower = question.toLowerCase();

      if (questionLower.includes('hello') || questionLower.includes('hi') ||
          questionLower.includes('नमस्कार') || questionLower.includes('नमस्ते') ||
          questionLower.includes('ನಮಸ್ಕಾರ')) {
        answer = responses.greeting;
      }
      else if (questionLower.includes('disease') || questionLower.includes('रोग') ||
               questionLower.includes('ರೋಗ') || questionLower.includes('sick') ||
               questionLower.includes('problem') || questionLower.includes('spots') ||
               questionLower.includes('डाग') || questionLower.includes('ಕಲೆ')) {
        answer = responses.disease;
      }
      else if (questionLower.includes('price') || questionLower.includes('market') ||
               questionLower.includes('बाजार') || questionLower.includes('भाव') ||
               questionLower.includes('ಮಾರುಕಟ್ಟೆ') || questionLower.includes('ಬೆಲೆ') ||
               questionLower.includes('sell') || questionLower.includes('मंडी')) {
        answer = responses.market;
      }
      else if (questionLower.includes('weather') || questionLower.includes('rain') ||
               questionLower.includes('हवामान') || questionLower.includes('मौसम') ||
               questionLower.includes('ಹವಾಮಾನ') || questionLower.includes('पाऊस') ||
               questionLower.includes('ಮಳೆ')) {
        answer = responses.weather;
      }
      else if (questionLower.includes('fertilizer') || questionLower.includes('खत') ||
               questionLower.includes('उर्वरक') || questionLower.includes('ಗೊಬ್ಬರ') ||
               questionLower.includes('nutrient') || questionLower.includes('soil')) {
        answer = responses.fertilizer;
      }
      else {
        answer = responses.default;
      }
      source = 'keyword-fallback';
    }

    // 💾 Save chat history to database
    try {
      const chatHistory = new ChatHistory({
        question,
        answer,
        language,
        source
      });
      await chatHistory.save();
      console.log('✅ Chat history saved to database');
    } catch (dbError) {
      console.log('⚠️  Database save failed (continuing without save):', dbError.message);
    }

    // Return response
    res.json({
      success: true,
      question,
      answer,
      language,
      source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// GET: Health check for AI service
router.get("/status", (req, res) => {
  res.json({
    status: "online",
    service: "AI Farm Assistant",
    languages: ["en", "kn", "hi", "mr"],
    ai_providers: {
      gemini: { available: !!GEMINI_API_KEY, type: "Free (60 req/min)" },
      openai: { available: !!OPENAI_API_KEY, type: "Paid" },
      fallback: { available: true, type: "Keyword matching" }
    },
    features: [
      "AI-powered crop advice (Gemini/OpenAI)",
      "Crop disease identification",
      "Market price information",
      "Weather advisory",
      "Fertilizer recommendations",
      "Multi-language support"
    ]
  });
});

// GET: Retrieve all chat history from database
router.get("/history", async (req, res) => {
  try {
    const chatHistory = await ChatHistory.find().sort({ timestamp: -1 }).limit(100);
    
    res.json({
      success: true,
      count: chatHistory.length,
      data: chatHistory
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to retrieve chat history", 
      message: error.message 
    });
  }
});

export default router;
