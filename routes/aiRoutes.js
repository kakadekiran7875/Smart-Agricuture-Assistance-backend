import express from "express";
import mongoose from "mongoose";
const router = express.Router();

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

    // Get language responses (default to English if language not supported)
    const responses = AI_RESPONSES[language] || AI_RESPONSES['en'];
    
    // Convert question to lowercase for keyword matching
    const questionLower = question.toLowerCase();
    
    // Keyword matching logic
    let answer;
    
    if (questionLower.includes('hello') || questionLower.includes('hi') || 
        questionLower.includes('नमस्कार') || questionLower.includes('नमस्ते') ||
        questionLower.includes('ನಮಸ್ಕಾರ')) {
      answer = responses.greeting;
    }
    else if (questionLower.includes('disease') || questionLower.includes('रोग') || 
             questionLower.includes('ರೋಗ') || questionLower.includes('sick') ||
             questionLower.includes('problem') || questionLower.includes('spots') ||
             questionLower.includes('डाग') || questionLower.includes('कलೆ')) {
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

    // 💾 Save chat history to database
    try {
      const chatHistory = new ChatHistory({
        question,
        answer,
        language
      });
      await chatHistory.save();
      console.log('✅ Chat history saved to database');
    } catch (dbError) {
      console.log('⚠️  Database save failed (continuing without save):', dbError.message);
    }

    // Return response
    res.json({
      question,
      answer,
      language,
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
    features: [
      "Crop disease identification",
      "Market price information",
      "Weather advisory",
      "Fertilizer recommendations"
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
