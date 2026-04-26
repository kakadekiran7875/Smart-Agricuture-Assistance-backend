import express from "express";
import mongoose from "mongoose";
import { translateCropName } from "../utils/translations.js";
const router = express.Router();

// Crop Data Schema
const cropDataSchema = new mongoose.Schema({
  nitrogen: Number,
  phosphorus: Number,
  recommendedCrop: String,
  confidence: String,
  alternativeCrops: [String],
  timestamp: { type: Date, default: Date.now }
});

const CropData = mongoose.model('CropData', cropDataSchema);

// Crop recommendation database with NPK requirements
const CROP_DATABASE = {
  "Rice": {
    nitrogenRange: { min: 300, max: 1000, optimal: 350 },
    phosphorusRange: { min: 15, max: 60, optimal: 25 },
    alternatives: ["Wheat", "Maize"]
  },
  "Wheat": {
    nitrogenRange: { min: 250, max: 1000, optimal: 300 },
    phosphorusRange: { min: 15, max: 50, optimal: 25 },
    alternatives: ["Rice", "Maize"]
  },
  "Maize": {
    nitrogenRange: { min: 300, max: 1000, optimal: 350 },
    phosphorusRange: { min: 20, max: 60, optimal: 30 },
    alternatives: ["Rice", "Wheat"]
  },
  "Sugarcane": {
    nitrogenRange: { min: 350, max: 1000, optimal: 400 },
    phosphorusRange: { min: 30, max: 80, optimal: 40 },
    alternatives: ["Rice", "Maize"]
  },
  "Cotton": {
    nitrogenRange: { min: 150, max: 300, optimal: 200 },
    phosphorusRange: { min: 30, max: 80, optimal: 50 },
    alternatives: ["Tomato", "Potato"]
  },
  "Tomato": {
    nitrogenRange: { min: 150, max: 300, optimal: 200 },
    phosphorusRange: { min: 30, max: 100, optimal: 60 },
    alternatives: ["Potato", "Cotton"]
  },
  "Potato": {
    nitrogenRange: { min: 150, max: 300, optimal: 200 },
    phosphorusRange: { min: 40, max: 100, optimal: 70 },
    alternatives: ["Tomato", "Cotton"]
  },
  "Cabbage": {
    nitrogenRange: { min: 150, max: 300, optimal: 200 },
    phosphorusRange: { min: 20, max: 60, optimal: 40 },
    alternatives: ["Cauliflower", "Broccoli"]
  },
  "Onion": {
    nitrogenRange: { min: 150, max: 300, optimal: 180 },
    phosphorusRange: { min: 15, max: 40, optimal: 25 },
    alternatives: ["Garlic", "Cabbage"]
  },
  "Lentils": {
    nitrogenRange: { min: 0, max: 150, optimal: 50 },
    phosphorusRange: { min: 10, max: 30, optimal: 20 },
    alternatives: ["Chickpeas", "Groundnut"]
  },
  "Chickpeas": {
    nitrogenRange: { min: 0, max: 150, optimal: 50 },
    phosphorusRange: { min: 10, max: 30, optimal: 20 },
    alternatives: ["Lentils", "Groundnut"]
  },
  "Groundnut": {
    nitrogenRange: { min: 0, max: 150, optimal: 80 },
    phosphorusRange: { min: 10, max: 30, optimal: 25 },
    alternatives: ["Lentils", "Chickpeas"]
  },
  "Millets": {
    nitrogenRange: { min: 0, max: 150, optimal: 100 },
    phosphorusRange: { min: 0, max: 15, optimal: 10 },
    alternatives: ["Sorghum", "Groundnut"]
  },
  "Sorghum": {
    nitrogenRange: { min: 0, max: 150, optimal: 100 },
    phosphorusRange: { min: 0, max: 15, optimal: 10 },
    alternatives: ["Millets", "Groundnut"]
  }
};

/**
 * Calculate crop suitability score
 * @param {number} nitrogen - Nitrogen level
 * @param {number} phosphorus - Phosphorus level
 * @param {object} cropData - Crop requirements
 * @returns {number} Suitability score (0-100)
 */
function calculateSuitability(nitrogen, phosphorus, cropData) {
  const nRange = cropData.nitrogenRange;
  const pRange = cropData.phosphorusRange;

  // Calculate nitrogen score
  let nScore = 0;
  if (nitrogen >= nRange.min && nitrogen <= nRange.max) {
    // Within range - calculate how close to optimal
    const deviation = Math.abs(nitrogen - nRange.optimal);
    const maxDeviation = Math.max(nRange.optimal - nRange.min, nRange.max - nRange.optimal);
    nScore = 100 - (deviation / maxDeviation * 50);
  } else if (nitrogen < nRange.min) {
    // Below minimum
    const deficit = nRange.min - nitrogen;
    nScore = Math.max(0, 50 - (deficit / nRange.min * 50));
  } else {
    // Above maximum
    const excess = nitrogen - nRange.max;
    nScore = Math.max(0, 50 - (excess / nRange.max * 50));
  }

  // Calculate phosphorus score
  let pScore = 0;
  if (phosphorus >= pRange.min && phosphorus <= pRange.max) {
    const deviation = Math.abs(phosphorus - pRange.optimal);
    const maxDeviation = Math.max(pRange.optimal - pRange.min, pRange.max - pRange.optimal);
    pScore = 100 - (deviation / maxDeviation * 50);
  } else if (phosphorus < pRange.min) {
    const deficit = pRange.min - phosphorus;
    pScore = Math.max(0, 50 - (deficit / pRange.min * 50));
  } else {
    const excess = phosphorus - pRange.max;
    pScore = Math.max(0, 50 - (excess / pRange.max * 50));
  }

  // Average score
  return (nScore + pScore) / 2;
}

/**
 * Get confidence level based on score
 * @param {number} score - Suitability score
 * @returns {string} Confidence level
 */
function getConfidence(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

// POST: Recommend crop based on soil nutrients
router.post("/recommend", async (req, res) => {
  try {
    const { nitrogen, phosphorus, language } = req.body;

    // Validation: Check if fields are present
    if (nitrogen === undefined || phosphorus === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both nitrogen and phosphorus are required"
      });
    }

    // Validation: Check if values are numbers
    if (typeof nitrogen !== 'number' || typeof phosphorus !== 'number') {
      return res.status(400).json({
        error: "Invalid input",
        message: "Nitrogen and phosphorus must be numbers"
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

    console.log(`🌾 Recommending crop for N: ${nitrogen}, P: ${phosphorus}`);

    // Calculate suitability scores for all crops
    const cropScores = [];
    for (const [cropName, cropData] of Object.entries(CROP_DATABASE)) {
      const score = calculateSuitability(nitrogen, phosphorus, cropData);
      cropScores.push({
        crop: cropName,
        score: score,
        alternatives: cropData.alternatives
      });
    }

    // Sort by score (highest first)
    cropScores.sort((a, b) => b.score - a.score);

    // Get top recommendation
    const topCrop = cropScores[0];
    const confidence = getConfidence(topCrop.score);

    // Get alternative crops (next 2 best options)
    const alternativeCrops = cropScores.slice(1, 3).map(c => c.crop);

    const result = {
      recommendedCrop: topCrop.crop,
      nitrogen: nitrogen,
      phosphorus: phosphorus,
      confidence: confidence,
      alternativeCrops: alternativeCrops,
      message: "Crop recommendation generated successfully",
      language: language || 'en'
    };

    // Translate if requested
    if (language === 'mr') {
      result.recommendedCropOriginal = result.recommendedCrop;
      result.recommendedCrop = translateCropName(result.recommendedCrop, 'mr');
      result.alternativeCrops = result.alternativeCrops.map(c => translateCropName(c, 'mr'));
    }

    // Save to database
    try {
      const cropData = new CropData({
        nitrogen,
        phosphorus,
        recommendedCrop: topCrop.crop,
        confidence: confidence,
        alternativeCrops: alternativeCrops
      });
      await cropData.save();
      console.log(`✅ Crop recommendation saved: ${topCrop.crop} (${confidence} confidence)`);
    } catch (dbError) {
      console.log('⚠️  Database save failed (continuing without save):', dbError.message);
    }

    res.json(result);

  } catch (error) {
    console.error("❌ Crop recommendation error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// GET: Retrieve all crop data from database
router.get("/all", async (req, res) => {
  try {
    const cropData = await CropData.find().sort({ timestamp: -1 }).limit(100);

    res.json({
      success: true,
      count: cropData.length,
      data: cropData
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve data",
      message: error.message
    });
  }
});

// GET: Get crop requirements
router.get("/requirements/:cropName", (req, res) => {
  try {
    const { cropName } = req.params;
    const cropData = CROP_DATABASE[cropName];

    if (!cropData) {
      return res.status(404).json({
        error: "Crop not found",
        message: `No data available for ${cropName}`
      });
    }

    res.json({
      crop: cropName,
      requirements: cropData,
      message: `Nutrient requirements for ${cropName}`
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// GET: List all supported crops
router.get("/list", (req, res) => {
  res.json({
    crops: Object.keys(CROP_DATABASE),
    totalCrops: Object.keys(CROP_DATABASE).length,
    message: "List of all supported crops"
  });
});

export default router;
