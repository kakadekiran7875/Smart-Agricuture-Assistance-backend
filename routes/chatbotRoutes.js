import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// System prompt for agricultural assistant
const SYSTEM_PROMPT = `You are an expert agricultural assistant for Indian farmers. You provide helpful advice on:
- Crop cultivation and farming techniques
- Disease identification and treatment
- Weather-based farming recommendations
- Market prices and selling strategies
- Soil management and fertilization
- Pest control and organic farming
- Government schemes and subsidies

Always provide practical, actionable advice in simple language. Be supportive and encouraging to farmers.`;

// POST: Chat with AI Assistant
router.post("/chat", async (req, res) => {
  try {
    const { message, language, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    console.log("🤖 AI Chatbot request received");
    console.log(`📝 Message: ${message.substring(0, 50)}...`);

    // Check if API key is available
    if (!OPENAI_API_KEY) {
      console.log("⚠️  No OpenAI API key, returning fallback response");
      return res.json({
        success: true,
        response: "I'm here to help with your farming questions! However, the AI service is currently unavailable. Please try again later or contact support.",
        source: "fallback"
      });
    }

    // Prepare conversation messages
    const messages = [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    // Call OpenAI API
    console.log("🌐 Calling OpenAI API...");
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log("✅ AI response generated");
    console.log(`📤 Response: ${aiResponse.substring(0, 50)}...`);

    res.json({
      success: true,
      response: aiResponse,
      source: "openai",
      model: "gpt-3.5-turbo",
      usage: response.data.usage
    });

  } catch (error) {
    console.error("❌ Chatbot error:", error.message);

    // Fallback response on error
    const fallbackResponse = {
      success: true,
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment. In the meantime, you can explore our disease detection, weather forecast, and market prices features!",
      source: "fallback_error",
      error: error.message
    };

    res.json(fallbackResponse);
  }
});

// POST: Get farming advice based on context
router.post("/advice", async (req, res) => {
  try {
    const { crop, issue, location, language } = req.body;

    if (!crop && !issue) {
      return res.status(400).json({
        success: false,
        error: "Crop or issue information is required"
      });
    }

    console.log("🌾 Farming advice request");
    console.log(`Crop: ${crop}, Issue: ${issue}, Location: ${location}`);

    // Build specific prompt
    let prompt = `I need farming advice for the following:\n`;
    if (crop) prompt += `Crop: ${crop}\n`;
    if (issue) prompt += `Issue/Question: ${issue}\n`;
    if (location) prompt += `Location: ${location}\n`;
    prompt += `\nPlease provide practical, actionable advice.`;

    if (!OPENAI_API_KEY) {
      return res.json({
        success: true,
        advice: "For specific farming advice, please consult with local agricultural experts or visit your nearest Krishi Vigyan Kendra (KVK).",
        source: "fallback"
      });
    }

    // Call OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 30000
      }
    );

    const advice = response.data.choices[0].message.content;
    console.log("✅ Farming advice generated");

    res.json({
      success: true,
      advice: advice,
      source: "openai",
      crop: crop,
      issue: issue
    });

  } catch (error) {
    console.error("❌ Advice error:", error.message);
    res.json({
      success: true,
      advice: "Please consult with local agricultural experts for specific advice on your farming issue.",
      source: "fallback_error"
    });
  }
});

// GET: Get quick farming tips
router.get("/tips", async (req, res) => {
  try {
    const { category } = req.query; // e.g., 'irrigation', 'pest-control', 'fertilization'

    console.log(`💡 Quick tips request: ${category || 'general'}`);

    if (!OPENAI_API_KEY) {
      // Fallback tips
      const fallbackTips = {
        general: [
          "Monitor your crops regularly for early disease detection",
          "Maintain proper soil moisture levels",
          "Use crop rotation to improve soil health",
          "Keep farm records for better decision making"
        ],
        irrigation: [
          "Water crops early morning or late evening",
          "Use drip irrigation to save water",
          "Check soil moisture before watering",
          "Avoid overwatering to prevent root diseases"
        ],
        "pest-control": [
          "Use neem-based organic pesticides",
          "Encourage natural predators in your farm",
          "Practice crop rotation to break pest cycles",
          "Remove infected plants immediately"
        ]
      };

      return res.json({
        success: true,
        tips: fallbackTips[category] || fallbackTips.general,
        category: category || 'general',
        source: "fallback"
      });
    }

    // Get AI-generated tips
    const prompt = category
      ? `Provide 5 practical farming tips specifically for ${category} in Indian agriculture.`
      : `Provide 5 general practical farming tips for Indian farmers.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 20000
      }
    );

    const tipsText = response.data.choices[0].message.content;
    // Parse tips from response (assuming numbered list)
    const tips = tipsText.split('\n').filter(line => line.trim().length > 0);

    console.log("✅ Tips generated");

    res.json({
      success: true,
      tips: tips,
      category: category || 'general',
      source: "openai"
    });

  } catch (error) {
    console.error("❌ Tips error:", error.message);
    res.json({
      success: true,
      tips: [
        "Monitor crops regularly",
        "Maintain soil health",
        "Use water efficiently",
        "Practice integrated pest management"
      ],
      source: "fallback_error"
    });
  }
});

export default router;
