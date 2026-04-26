import { translateCropName } from '../utils/translations.js';

// Crop database with requirements
const CROP_DATABASE = {
  rice: { n: [80, 120], p: [40, 60], k: [40, 60], ph: [5.5, 7.0], temp: [20, 30], rain: [150, 300] },
  wheat: { n: [100, 140], p: [40, 60], k: [40, 60], ph: [6.0, 7.5], temp: [15, 25], rain: [50, 100] },
  cotton: { n: [60, 100], p: [30, 50], k: [30, 50], ph: [6.0, 7.5], temp: [21, 30], rain: [50, 100] },
  sugarcane: { n: [200, 300], p: [80, 120], k: [100, 150], ph: [6.0, 7.5], temp: [20, 30], rain: [150, 250] },
  soybean: { n: [20, 40], p: [60, 80], k: [40, 60], ph: [6.0, 7.0], temp: [20, 30], rain: [60, 100] },
  maize: { n: [100, 150], p: [50, 75], k: [40, 60], ph: [5.5, 7.0], temp: [18, 27], rain: [50, 100] },
  groundnut: { n: [20, 40], p: [40, 60], k: [60, 80], ph: [6.0, 7.0], temp: [20, 30], rain: [50, 75] },
  onion: { n: [100, 150], p: [50, 75], k: [100, 150], ph: [6.0, 7.0], temp: [13, 24], rain: [65, 100] },
  potato: { n: [100, 150], p: [50, 80], k: [100, 150], ph: [5.0, 6.5], temp: [15, 20], rain: [50, 70] },
  tomato: { n: [100, 150], p: [50, 80], k: [100, 150], ph: [6.0, 7.0], temp: [18, 27], rain: [60, 150] }
};

class AgricultureService {
  /**
   * Recommend crops based on soil and weather parameters
   */
  recommendCrops(n, p, k, ph, temp, rain, language = 'en') {
    const suitableCrops = [];

    for (const [crop, requirements] of Object.entries(CROP_DATABASE)) {
      let score = 0;
      const maxScore = 6;

      // Check each parameter
      if (n >= requirements.n[0] && n <= requirements.n[1]) score++;
      if (p >= requirements.p[0] && p <= requirements.p[1]) score++;
      if (k >= requirements.k[0] && k <= requirements.k[1]) score++;
      if (ph >= requirements.ph[0] && ph <= requirements.ph[1]) score++;
      if (temp >= requirements.temp[0] && temp <= requirements.temp[1]) score++;
      if (rain >= requirements.rain[0] && rain <= requirements.rain[1]) score++;

      if (score >= 4) {
        suitableCrops.push({ crop, confidence: score / maxScore });
      }
    }

    // Sort by confidence
    suitableCrops.sort((a, b) => b.confidence - a.confidence);

    // Get top 3 crops
    const topCrops = suitableCrops.slice(0, 3);
    if (topCrops.length === 0) {
      topCrops.push({ crop: 'rice', confidence: 0.5 });
    }

    // Translate crop names
    const translatedCrops = topCrops.map(item =>
      language === 'mr' ? translateCropName(item.crop, 'mr') : item.crop
    );

    const avgConfidence = topCrops.reduce((sum, item) => sum + item.confidence, 0) / topCrops.length;

    // Generate explanation
    let explanation;
    if (language === 'mr') {
      explanation = `तुमच्या मातीच्या आणि हवामानाच्या परिस्थितीनुसार, या पिकांची शिफारस केली जाते. माती pH: ${ph.toFixed(1)}, तापमान: ${temp.toFixed(1)}°C`;
    } else if (language === 'hi') {
      explanation = `आपकी मिट्टी और मौसम की स्थिति के अनुसार, इन फसलों की सिफारिश की जाती है। मिट्टी pH: ${ph.toFixed(1)}, तापमान: ${temp.toFixed(1)}°C`;
    } else {
      explanation = `Based on your soil and weather conditions, these crops are recommended. Soil pH: ${ph.toFixed(1)}, Temperature: ${temp.toFixed(1)}°C`;
    }

    return {
      recommended_crops: translatedCrops,
      confidence: Math.round(avgConfidence * 100) / 100,
      explanation,
      language
    };
  }

  /**
   * Analyze soil health
   */
  analyzeSoil(n, p, k, ph, soilType, language = 'en') {
    const deficiencies = [];
    const recommendations = [];

    // Check nutrient levels
    if (n < 50) {
      if (language === 'mr') {
        deficiencies.push('नायट्रोजनची कमतरता');
        recommendations.push('युरिया किंवा अमोनियम सल्फेट वापरा');
      } else {
        deficiencies.push('Nitrogen deficiency');
        recommendations.push('Apply urea or ammonium sulfate');
      }
    }

    if (p < 30) {
      if (language === 'mr') {
        deficiencies.push('फॉस्फरसची कमतरता');
        recommendations.push('सिंगल सुपर फॉस्फेट वापरा');
      } else {
        deficiencies.push('Phosphorus deficiency');
        recommendations.push('Apply single super phosphate');
      }
    }

    if (k < 30) {
      if (language === 'mr') {
        deficiencies.push('पोटॅशियमची कमतरता');
        recommendations.push('म्युरेट ऑफ पोटॅश वापरा');
      } else {
        deficiencies.push('Potassium deficiency');
        recommendations.push('Apply muriate of potash');
      }
    }

    // Check pH
    if (ph < 5.5) {
      recommendations.push(language === 'mr' ? 'माती आम्लीय आहे - चुना वापरा' : 'Soil is acidic - apply lime');
    } else if (ph > 8.0) {
      recommendations.push(language === 'mr' ? 'माती क्षारीय आहे - जिप्सम वापरा' : 'Soil is alkaline - apply gypsum');
    }

    // Determine soil health
    const nutrientScore = (Math.min(n / 100, 1) + Math.min(p / 60, 1) + Math.min(k / 60, 1)) / 3;
    const phScore = (ph >= 6.0 && ph <= 7.5) ? 1.0 : 0.5;
    const overallScore = (nutrientScore + phScore) / 2;

    let health;
    if (overallScore > 0.7) {
      health = language === 'mr' ? 'उत्तम' : 'Excellent';
    } else if (overallScore > 0.5) {
      health = language === 'mr' ? 'चांगली' : 'Good';
    } else {
      health = language === 'mr' ? 'सुधारणा आवश्यक' : 'Needs improvement';
    }

    if (deficiencies.length === 0) {
      deficiencies.push(language === 'mr' ? 'कोणतीही मोठी कमतरता नाही' : 'No major deficiencies');
    }

    return {
      soil_health: health,
      recommendations,
      deficiencies,
      language
    };
  }

  /**
   * Get pest control recommendations
   */
  getPestControl(crop, pestDesc, language = 'en') {
    const pestName = language === 'mr' ? 'सामान्य कीटक' : 'Common pest';

    let controlMethods, organic, chemical;

    if (language === 'mr') {
      controlMethods = [
        'नियमित शेत तपासणी करा',
        'प्रभावित पाने काढून टाका',
        'पिकाची फेरपालट करा'
      ];
      organic = ['नीम तेल फवारणी', 'गोमूत्र मिश्रण'];
      chemical = ['स्थानिक कृषी विभागाशी संपर्क साधा'];
    } else {
      controlMethods = [
        'Regular field inspection',
        'Remove affected leaves',
        'Practice crop rotation'
      ];
      organic = ['Neem oil spray', 'Cow urine mixture'];
      chemical = ['Consult local agriculture department'];
    }

    return {
      identified_pest: pestName,
      control_methods: controlMethods,
      organic_solutions: organic,
      chemical_solutions: chemical,
      language
    };
  }

  /**
   * Get fertilizer recommendations
   */
  getFertilizerRecommendation(crop, soilType, n, p, k, growthStage, language = 'en') {
    let fertilizer, quantity, method, timing, precautions;

    if (language === 'mr') {
      if (growthStage === 'seedling') {
        fertilizer = 'स्टार्टर खत (NPK 10:26:26)';
        quantity = '50 किलो प्रति हेक्टर';
        method = "बियाण्याच्या खाली 5 सेमी खोलीवर द्या";
        timing = 'पेरणीच्या वेळी';
        precautions = [
          "खत बियाण्याच्या थेट संपर्कात येऊ देऊ नका",
          'माती ओलसर असताना द्या'
        ];
      } else if (growthStage === 'vegetative') {
        fertilizer = 'युरिया आणि NPK मिश्रण';
        quantity = '100 किलो युरिया + 50 किलो NPK प्रति हेक्टर';
        method = 'पिकाच्या ओळीच्या बाजूला टाका आणि माती मिसळा';
        timing = 'पेरणीनंतर 3-4 आठवड्यांनी';
        precautions = [
          'पाण्याची उपलब्धता सुनिश्चित करा',
          'पावसाळ्यात देण्याचे टाळा'
        ];
      } else {
        fertilizer = 'पोटॅश युक्त खत (NPK 12:32:16)';
        quantity = '75 किलो प्रति हेक्टर';
        method = 'पाण्यात विरघळवून फवारणी';
        timing = 'फुलोरा सुरू झाल्यावर';
        precautions = [
          'दुपारच्या उष्णतेत फवारणी टाळा',
          'योग्य पाणी व्यवस्थापन करा'
        ];
      }
    } else {
      if (growthStage === 'seedling') {
        fertilizer = 'Starter fertilizer (NPK 10:26:26)';
        quantity = '50 kg per hectare';
        method = 'Apply 5 cm below seed level';
        timing = 'At sowing time';
        precautions = [
          'Avoid direct contact with seeds',
          'Apply when soil is moist'
        ];
      } else if (growthStage === 'vegetative') {
        fertilizer = 'Urea and NPK mixture';
        quantity = '100 kg urea + 50 kg NPK per hectare';
        method = 'Side dress along crop rows and incorporate';
        timing = '3-4 weeks after sowing';
        precautions = [
          'Ensure water availability',
          'Avoid during heavy rains'
        ];
      } else {
        fertilizer = 'Potash rich fertilizer (NPK 12:32:16)';
        quantity = '75 kg per hectare';
        method = 'Foliar spray dissolved in water';
        timing = 'At flowering initiation';
        precautions = [
          'Avoid spraying in hot afternoon',
          'Maintain proper irrigation'
        ];
      }
    }

    return {
      fertilizer_type: fertilizer,
      quantity,
      application_method: method,
      timing,
      precautions,
      language
    };
  }

  /**
   * Get market price information
   */
  getMarketPrice(crop, location, language = 'en') {
    const basePrices = {
      rice: 2000,
      wheat: 2500,
      cotton: 6000,
      sugarcane: 3000,
      soybean: 4000,
      onion: 1500,
      potato: 1200,
      tomato: 2500
    };

    const cropLower = crop.toLowerCase();
    const price = basePrices[cropLower] || 2000;

    if (language === 'mr') {
      const cropName = translateCropName(crop, 'mr');
      const locationText = location || 'महाराष्ट्र';
      return {
        crop: cropName,
        location: locationText,
        current_price: `₹${price} प्रति क्विंटल`,
        price_trend: 'स्थिर ते किंचित वाढणारा',
        market_advisory: `${cropName}ची मागणी चांगली आहे. जवळच्या मंडीत विक्री करा.`,
        language
      };
    } else {
      const locationText = location || 'Maharashtra';
      return {
        crop,
        location: locationText,
        current_price: `₹${price} per quintal`,
        price_trend: 'Stable to slightly increasing',
        market_advisory: `Demand for ${crop} is good. Sell at nearby mandi.`,
        language
      };
    }
  }
}

export default new AgricultureService();
