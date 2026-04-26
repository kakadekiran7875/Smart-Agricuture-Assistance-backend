import express from "express";
const router = express.Router();

// Supported crops
const SUPPORTED_CROPS = [
  "Rice", "Wheat", "Maize", "Cotton", "Sugarcane",
  "Tomato", "Potato", "Onion", "Chili", "Cabbage"
];

// Crop optimal NPK requirements (kg/ha)
const CROP_REQUIREMENTS = {
  "Rice": {
    nitrogen: { optimal: 120, min: 80, max: 150 },
    phosphorus: { optimal: 50, min: 40, max: 60 },
    potassium: { optimal: 50, min: 40, max: 60 }
  },
  "Wheat": {
    nitrogen: { optimal: 110, min: 100, max: 120 },
    phosphorus: { optimal: 45, min: 40, max: 50 },
    potassium: { optimal: 35, min: 30, max: 40 }
  },
  "Maize": {
    nitrogen: { optimal: 130, min: 120, max: 150 },
    phosphorus: { optimal: 50, min: 40, max: 60 },
    potassium: { optimal: 50, min: 40, max: 60 }
  },
  "Cotton": {
    nitrogen: { optimal: 135, min: 120, max: 150 },
    phosphorus: { optimal: 55, min: 50, max: 60 },
    potassium: { optimal: 55, min: 50, max: 60 }
  },
  "Sugarcane": {
    nitrogen: { optimal: 150, min: 120, max: 180 },
    phosphorus: { optimal: 60, min: 50, max: 70 },
    potassium: { optimal: 80, min: 60, max: 100 }
  },
  "Tomato": {
    nitrogen: { optimal: 125, min: 100, max: 150 },
    phosphorus: { optimal: 65, min: 50, max: 80 },
    potassium: { optimal: 100, min: 80, max: 120 }
  },
  "Potato": {
    nitrogen: { optimal: 125, min: 100, max: 150 },
    phosphorus: { optimal: 65, min: 50, max: 80 },
    potassium: { optimal: 100, min: 80, max: 120 }
  },
  "Onion": {
    nitrogen: { optimal: 110, min: 100, max: 130 },
    phosphorus: { optimal: 50, min: 40, max: 60 },
    potassium: { optimal: 80, min: 60, max: 100 }
  },
  "Chili": {
    nitrogen: { optimal: 120, min: 100, max: 140 },
    phosphorus: { optimal: 60, min: 50, max: 70 },
    potassium: { optimal: 90, min: 70, max: 110 }
  },
  "Cabbage": {
    nitrogen: { optimal: 130, min: 120, max: 150 },
    phosphorus: { optimal: 55, min: 50, max: 60 },
    potassium: { optimal: 70, min: 60, max: 80 }
  }
};

// Fertilizer database
const FERTILIZERS = {
  "Urea": { n: 46, p: 0, k: 0 },
  "DAP": { n: 18, p: 46, k: 0 },
  "MOP": { n: 0, p: 0, k: 60 },
  "SSP": { n: 0, p: 16, k: 0 },
  "NPK 20-20-20": { n: 20, p: 20, k: 20 },
  "NPK 19-19-19": { n: 19, p: 19, k: 19 },
  "NPK 12-32-16": { n: 12, p: 32, k: 16 },
  "NPK 10-26-26": { n: 10, p: 26, k: 26 }
};

// Application timing for different crops
const APPLICATION_TIMING = {
  "Rice": {
    method: "Split application in 3 doses",
    timing: "Basal (30%), Tillering (40%), Panicle initiation (30%)"
  },
  "Wheat": {
    method: "Split application in 3 doses",
    timing: "Sowing (50%), Crown root initiation (25%), Flowering (25%)"
  },
  "Maize": {
    method: "Split application in 2-3 doses",
    timing: "Sowing (50%), Knee-high stage (30%), Tasseling (20%)"
  },
  "Cotton": {
    method: "Split application in 3-4 doses",
    timing: "Basal, Square formation, Flowering, Boll development"
  },
  "Sugarcane": {
    method: "Split application in 3 doses",
    timing: "Planting (33%), Tillering (33%), Grand growth (34%)"
  },
  "Tomato": {
    method: "Split application in 4 doses",
    timing: "Transplanting, Flowering, Fruit set, Fruit development"
  },
  "Potato": {
    method: "Split application in 3 doses",
    timing: "Planting (50%), Earthing up (30%), Tuber bulking (20%)"
  },
  "Onion": {
    method: "Split application in 3 doses",
    timing: "Transplanting (40%), 30 days after (30%), Bulb formation (30%)"
  },
  "Chili": {
    method: "Split application in 4 doses",
    timing: "Transplanting, Flowering, Fruit set, Fruit picking stage"
  },
  "Cabbage": {
    method: "Split application in 3 doses",
    timing: "Transplanting (40%), 3 weeks after (30%), Head formation (30%)"
  }
};

/**
 * Calculate nutrient deficit
 * @param {number} current - Current nutrient level
 * @param {object} requirement - Nutrient requirement
 * @returns {object} Deficit info
 */
function calculateDeficit(current, requirement) {
  const deficit = requirement.optimal - current;
  const percentDeficit = (deficit / requirement.optimal) * 100;
  
  return {
    deficit: Math.max(0, deficit),
    percentDeficit: Math.max(0, percentDeficit),
    isDeficient: current < requirement.min,
    isExcess: current > requirement.max,
    status: current < requirement.min ? "low" : 
            current > requirement.max ? "high" : "adequate"
  };
}

/**
 * Recommend fertilizer based on deficits
 * @param {object} nDeficit - Nitrogen deficit
 * @param {object} pDeficit - Phosphorus deficit
 * @param {object} kDeficit - Potassium deficit
 * @returns {object} Fertilizer recommendation
 */
function recommendFertilizer(nDeficit, pDeficit, kDeficit) {
  // Check which nutrients are deficient
  const nLow = nDeficit.percentDeficit > 50;
  const pLow = pDeficit.percentDeficit > 50;
  const kLow = kDeficit.percentDeficit > 50;
  
  // If all nutrients are balanced
  if (!nLow && !pLow && !kLow) {
    return {
      fertilizer: "NPK 20-20-20",
      dosage: "150 kg/ha",
      reason: "Balanced NPK for maintenance"
    };
  }
  
  // If only N is deficient
  if (nLow && !pLow && !kLow) {
    return {
      fertilizer: "Urea (46-0-0)",
      dosage: `${Math.ceil(nDeficit.deficit / 0.46)} kg/ha`,
      reason: "High nitrogen requirement"
    };
  }
  
  // If only P is deficient
  if (!nLow && pLow && !kLow) {
    return {
      fertilizer: "DAP (18-46-0)",
      dosage: `${Math.ceil(pDeficit.deficit / 0.46)} kg/ha`,
      reason: "High phosphorus requirement"
    };
  }
  
  // If only K is deficient
  if (!nLow && !pLow && kLow) {
    return {
      fertilizer: "MOP (0-0-60)",
      dosage: `${Math.ceil(kDeficit.deficit / 0.60)} kg/ha`,
      reason: "High potassium requirement"
    };
  }
  
  // If N and P are deficient
  if (nLow && pLow && !kLow) {
    return {
      fertilizer: "NPK 12-32-16",
      dosage: "200 kg/ha",
      reason: "Nitrogen and phosphorus deficiency"
    };
  }
  
  // If P and K are deficient
  if (!nLow && pLow && kLow) {
    return {
      fertilizer: "NPK 10-26-26",
      dosage: "180 kg/ha",
      reason: "Phosphorus and potassium deficiency"
    };
  }
  
  // If all are deficient or N and K deficient
  return {
    fertilizer: "NPK 19-19-19",
    dosage: "200 kg/ha",
    reason: "Multiple nutrient deficiency"
  };
}

// POST: Recommend fertilizer based on crop and soil nutrients
router.post("/recommend", (req, res) => {
  try {
    console.log("📥 Fertilizer request received:", req.body);
    let { crop, nitrogen, phosphorus, potassium } = req.body;

    // Validation: Check if all fields are present
    if (!crop || nitrogen === undefined || phosphorus === undefined || potassium === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "Crop, nitrogen, phosphorus, and potassium are required" 
      });
    }

    // Validation: Check if values are numbers
    if (typeof nitrogen !== 'number' || typeof phosphorus !== 'number' || typeof potassium !== 'number') {
      return res.status(400).json({ 
        error: "Invalid input",
        message: "Nitrogen, phosphorus, and potassium must be numbers" 
      });
    }

    // Normalize crop name
    crop = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();

    // Validation: Check if crop is supported
    if (!SUPPORTED_CROPS.includes(crop)) {
      return res.status(400).json({ 
        error: "Invalid crop",
        message: `The specified crop is not supported. Supported crops: ${SUPPORTED_CROPS.join(', ')}` 
      });
    }

    // Validation: Check ranges
    if (nitrogen < 0 || nitrogen > 1000) {
      return res.status(400).json({ 
        error: "Invalid input",
        message: "Nitrogen must be between 0 and 1000 kg/ha" 
      });
    }

    if (phosphorus < 0 || phosphorus > 200) {
      return res.status(400).json({ 
        error: "Invalid input",
        message: "Phosphorus must be between 0 and 200 kg/ha" 
      });
    }

    if (potassium < 0 || potassium > 500) {
      return res.status(400).json({ 
        error: "Invalid input",
        message: "Potassium must be between 0 and 500 kg/ha" 
      });
    }

    console.log(`🌱 Recommending fertilizer for ${crop}: N=${nitrogen}, P=${phosphorus}, K=${potassium}`);

    // Get crop requirements
    const requirements = CROP_REQUIREMENTS[crop];

    // Calculate deficits
    const nDeficit = calculateDeficit(nitrogen, requirements.nitrogen);
    const pDeficit = calculateDeficit(phosphorus, requirements.phosphorus);
    const kDeficit = calculateDeficit(potassium, requirements.potassium);

    // Get fertilizer recommendation
    const recommendation = recommendFertilizer(nDeficit, pDeficit, kDeficit);

    // Get application timing
    const timing = APPLICATION_TIMING[crop];

    // Build response
    const result = {
      recommendedFertilizer: recommendation.fertilizer,
      crop: crop,
      nitrogen: nitrogen,
      phosphorus: phosphorus,
      potassium: potassium,
      dosage: recommendation.dosage,
      applicationMethod: timing.method,
      timing: timing.timing,
      nutrientStatus: {
        nitrogen: nDeficit.status,
        phosphorus: pDeficit.status,
        potassium: kDeficit.status
      },
      message: "Fertilizer recommendation generated successfully"
    };

    console.log(`✅ Recommended: ${recommendation.fertilizer} for ${crop}`);

    res.json(result);
    
  } catch (error) {
    console.error("❌ Fertilizer recommendation error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: error.message 
    });
  }
});

// GET: Get crop requirements
router.get("/requirements/:cropName", (req, res) => {
  try {
    let { cropName } = req.params;
    
    // Normalize crop name
    cropName = cropName.charAt(0).toUpperCase() + cropName.slice(1).toLowerCase();
    
    const requirements = CROP_REQUIREMENTS[cropName];
    
    if (!requirements) {
      return res.status(404).json({
        error: "Crop not found",
        message: `No fertilizer data available for ${cropName}`
      });
    }
    
    res.json({
      crop: cropName,
      requirements: requirements,
      timing: APPLICATION_TIMING[cropName],
      message: `Fertilizer requirements for ${cropName}`
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// GET: List all supported crops
router.get("/crops", (req, res) => {
  res.json({
    supportedCrops: SUPPORTED_CROPS,
    totalCrops: SUPPORTED_CROPS.length,
    message: "List of supported crops for fertilizer recommendation"
  });
});

// GET: List all fertilizers
router.get("/fertilizers", (req, res) => {
  res.json({
    fertilizers: Object.keys(FERTILIZERS).map(name => ({
      name: name,
      composition: FERTILIZERS[name]
    })),
    totalFertilizers: Object.keys(FERTILIZERS).length,
    message: "List of available fertilizers"
  });
});

export default router;
