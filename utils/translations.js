/**
 * Translation module for Marathi and other language support
 */

const TRANSLATIONS = {
  en: {
    welcome: "Welcome to Smart Agriculture Assistant",
    crop_recommendation: "Crop Recommendation",
    weather_info: "Weather Information",
    soil_analysis: "Soil Analysis",
    pest_control: "Pest Control",
    irrigation: "Irrigation Management",
    fertilizer: "Fertilizer Recommendation",
    market_price: "Market Price Information",
    success: "Success",
    error: "Error",
    not_found: "Not found"
  },
  mr: {
    welcome: "स्मार्ट कृषी सहाय्यकामध्ये आपले स्वागत आहे",
    crop_recommendation: "पीक शिफारस",
    weather_info: "हवामान माहिती",
    soil_analysis: "माती विश्लेषण",
    pest_control: "कीटक नियंत्रण",
    irrigation: "सिंचन व्यवस्थापन",
    fertilizer: "खत शिफारस",
    market_price: "बाजार भाव माहिती",
    success: "यशस्वी",
    error: "त्रुटी",
    not_found: "सापडले नाही"
  },
  hi: {
    welcome: "स्मार्ट कृषि सहायक में आपका स्वागत है",
    crop_recommendation: "फसल की सिफारिश",
    weather_info: "मौसम की जानकारी",
    soil_analysis: "मिट्टी विश्लेषण",
    pest_control: "कीट नियंत्रण",
    irrigation: "सिंचाई प्रबंधन",
    fertilizer: "उर्वरक की सिफारिश",
    market_price: "बाजार मूल्य जानकारी",
    success: "सफलता",
    error: "त्रुटि",
    not_found: "नहीं मिला"
  }
};

// Agriculture-specific Marathi terms
const AGRICULTURE_TERMS_MR = {
  rice: "तांदूळ",
  wheat: "गहू",
  cotton: "कापूस",
  sugarcane: "ऊस",
  soybean: "सोयाबीन",
  maize: "मका",
  groundnut: "शेंगदाणा",
  onion: "कांदा",
  potato: "बटाटा",
  tomato: "टोमॅटो",
  chili: "मिरची",
  turmeric: "हळद",
  banana: "केळी",
  mango: "आंबा",
  grapes: "द्राक्षे",
  pomegranate: "डाळिंब",
  nitrogen: "नायट्रोजन",
  phosphorus: "फॉस्फरस",
  potassium: "पोटॅशियम",
  organic: "सेंद्रिय",
  pesticide: "कीटकनाशक",
  fertilizer: "खत",
  seed: "बियाणे",
  harvest: "कापणी",
  sowing: "पेरणी",
  irrigation: "सिंचन",
  rainfall: "पाऊस",
  temperature: "तापमान",
  humidity: "आर्द्रता",
  soil: "माती",
  clay: "चिकणमाती",
  sandy: "वाळूमाती",
  loamy: "दुमट माती",
  // Severities
  low: "कमी",
  moderate: "मध्यम",
  high: "जास्त",
  critical: "गंभीर",
  // Pests
  "rice leaf folder": "तांदूळ पान गुंडाळणारी अळी",
  "brown plant hopper": "तपकिरी तुडतुडे",
  "stem borer": "खोड कीड",
  "rice gall midge": "तांदूळ गाळ मिज",
  "aphids": "मावा",
  "armyworm": "लष्करी अळी",
  "termites": "वाळवी",
  "cotton bollworm": "कापूस बोंडअळी",
  "whitefly": "पांढरी माशी",
  "jassids": "तुडतुडे",
  "fruit borer": "फळ पोखरणारी अळी",
  "leaf miner": "पान पोखरणारी अळी",
  "cutworm": "कटवर्म",
  "fall armyworm": "लष्करी अळी (FAW)",
  "cabbage butterfly": "कोबी फुलपाखरू",
  "diamondback moth": "हिऱ्याच्या आकाराचा पतंग",
  "early shoot borer": "खोड कीड (सुरुवातीची)",
  "thrips": "फुलकिडे",
  "fruit and shoot borer": "फळ आणि खोड पोखरणारी अळी"
};

/**
 * Get translation for a key in specified language
 */
function getTranslation(key, language = 'en') {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Translate crop name to specified language
 */
function translateCropName(crop, toLanguage = 'mr') {
  if (toLanguage === 'mr') {
    return AGRICULTURE_TERMS_MR[crop.toLowerCase()] || crop;
  }
  return crop;
}

/**
 * Translate term to specified language
 */
function translateTerm(term, toLanguage = 'mr') {
  if (toLanguage === 'mr') {
    return AGRICULTURE_TERMS_MR[term.toLowerCase()] || term;
  }
  return term;
}

export {
  TRANSLATIONS,
  AGRICULTURE_TERMS_MR,
  getTranslation,
  translateCropName,
  translateTerm
};
