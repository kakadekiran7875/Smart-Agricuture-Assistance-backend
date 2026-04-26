import express from "express";
import SoilAnalysis from "../models/SoilAnalysis.js";
import { translateTerm } from "../utils/translations.js";

const router = express.Router();

/**
 * Calculate soil quality based on pH and organic carbon
 * @param {number} ph - Soil pH level (0-14)
 * @param {number} organicCarbon - Organic carbon percentage (0-10)
 * @returns {string} Soil quality rating
 */
function calculateSoilQuality(ph, organicCarbon) {
  // Excellent: Optimal pH and high organic carbon
  if (ph >= 6.0 && ph <= 7.5 && organicCarbon >= 2.5) {
    return "Excellent";
  }

  // Good: Near-optimal pH and moderate organic carbon
  if (ph >= 5.5 && ph <= 8.0 && organicCarbon >= 1.5) {
    return "Good";
  }

  // Fair: Acceptable pH and low-moderate organic carbon
  if (ph >= 5.0 && ph <= 8.5 && organicCarbon >= 0.5) {
    return "Fair";
  }

  // Poor: Extreme pH or very low organic carbon
  return "Poor";
}

/**
 * Get pH classification
 * @param {number} ph - Soil pH level
 * @returns {object} pH classification details
 */
function getPhClassification(ph) {
  if (ph < 5.5) {
    return {
      classification: "Highly Acidic",
      soilType: "Needs lime treatment",
      recommendation: "Add lime to increase pH"
    };
  } else if (ph >= 5.5 && ph < 6.5) {
    return {
      classification: "Slightly Acidic",
      soilType: "Good for most crops",
      recommendation: "Suitable for most agricultural purposes"
    };
  } else if (ph >= 6.5 && ph <= 7.5) {
    return {
      classification: "Neutral",
      soilType: "Optimal for agriculture",
      recommendation: "Ideal pH range for most crops"
    };
  } else if (ph > 7.5 && ph <= 8.5) {
    return {
      classification: "Slightly Alkaline",
      soilType: "Suitable for specific crops",
      recommendation: "Good for alkaline-tolerant crops"
    };
  } else {
    return {
      classification: "Highly Alkaline",
      soilType: "Needs sulfur treatment",
      recommendation: "Add sulfur to decrease pH"
    };
  }
}

/**
 * Get organic carbon classification
 * @param {number} organicCarbon - Organic carbon percentage
 * @returns {object} Organic carbon classification details
 */
function getOrganicCarbonClassification(organicCarbon) {
  if (organicCarbon < 0.5) {
    return {
      classification: "Very Low",
      soilHealth: "Poor soil health",
      recommendation: "Add compost and organic matter urgently"
    };
  } else if (organicCarbon >= 0.5 && organicCarbon < 1.0) {
    return {
      classification: "Low",
      soilHealth: "Needs organic matter",
      recommendation: "Increase organic matter through composting"
    };
  } else if (organicCarbon >= 1.0 && organicCarbon < 2.0) {
    return {
      classification: "Medium",
      soilHealth: "Moderate soil health",
      recommendation: "Maintain current practices, consider adding more organic matter"
    };
  } else if (organicCarbon >= 2.0 && organicCarbon <= 3.0) {
    return {
      classification: "High",
      soilHealth: "Good soil health",
      recommendation: "Excellent organic content, maintain current practices"
    };
  } else {
    return {
      classification: "Very High",
      soilHealth: "Excellent soil health",
      recommendation: "Optimal organic carbon levels"
    };
  }
}

// POST: Analyze soil quality
router.post("/analyze", async (req, res) => {
  try {
    const { ph, organicCarbon, language } = req.body;

    // Validation: Check if fields are present
    if (ph === undefined || organicCarbon === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both ph and organicCarbon are required"
      });
    }

    // Validation: Check if values are numbers
    if (typeof ph !== 'number' || typeof organicCarbon !== 'number') {
      return res.status(400).json({
        error: "Invalid input parameters",
        message: "pH and organicCarbon must be numbers"
      });
    }

    // Validation: Check pH range
    if (ph < 0 || ph > 14) {
      return res.status(400).json({
        error: "Invalid input parameters",
        message: "pH must be between 0 and 14"
      });
    }

    // Validation: Check organic carbon range
    if (organicCarbon < 0 || organicCarbon > 10) {
      return res.status(400).json({
        error: "Invalid input parameters",
        message: "Organic carbon must be between 0 and 10"
      });
    }

    console.log(`🌱 Soil analysis request: pH=${ph}, OC=${organicCarbon}`);

    // Calculate soil quality
    const soilQuality = calculateSoilQuality(ph, organicCarbon);
    const phInfo = getPhClassification(ph);
    const carbonInfo = getOrganicCarbonClassification(organicCarbon);
    const overallRec = generateOverallRecommendation(soilQuality, phInfo, carbonInfo);

    // Save to database for analytics using native driver (avoids Mongoose buffering timeout)
    try {
      const analysisId = `SOIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Use native MongoDB driver instead of Mongoose model
      const mongoose = await import('mongoose');
      const db = mongoose.default.connection.db;

      if (db) {
        const soilAnalysisDoc = {
          analysis_id: analysisId,
          ph: ph,
          organic_carbon: organicCarbon,
          soil_quality: soilQuality,
          ph_classification: {
            classification: phInfo.classification,
            soil_type: phInfo.soilType,
            recommendation: phInfo.recommendation
          },
          carbon_classification: {
            classification: carbonInfo.classification,
            soil_health: carbonInfo.soilHealth,
            recommendation: carbonInfo.recommendation
          },
          overall_recommendation: overallRec,
          user_info: {
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent')
          },
          created_at: new Date()
        };

        await db.collection('soilanalyses').insertOne(soilAnalysisDoc);
        console.log(`✅ Soil analysis saved: ${analysisId}`);
      }
    } catch (dbError) {
      // Only log in debug mode to reduce noise
      if (process.env.DEBUG === 'true') {
        console.error("⚠️  Database save failed (non-critical):", dbError.message);
      }
      // Continue even if DB save fails
    }

    // Success response
    res.json({
      soilQuality,
      ph,
      organicCarbon,
      message: "Soil analysis completed successfully",
      details: {
        phAnalysis: {
          value: ph,
          classification: language === 'mr' ? translateTerm(phInfo.classification, 'mr') : phInfo.classification,
          soilType: language === 'mr' ? translateTerm(phInfo.soilType, 'mr') : phInfo.soilType,
          recommendation: language === 'mr' ? translateTerm(phInfo.recommendation, 'mr') : phInfo.recommendation
        },
        organicCarbonAnalysis: {
          value: organicCarbon,
          classification: language === 'mr' ? translateTerm(carbonInfo.classification, 'mr') : carbonInfo.classification,
          soilHealth: language === 'mr' ? translateTerm(carbonInfo.soilHealth, 'mr') : carbonInfo.soilHealth,
          recommendation: language === 'mr' ? translateTerm(carbonInfo.recommendation, 'mr') : carbonInfo.recommendation
        }
      },
      overallRecommendation: overallRec,
      language: language || 'en'
    });

  } catch (error) {
    console.error("❌ Soil analysis error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to analyze soil data"
    });
  }
});

/**
 * Generate overall recommendation based on analysis
 */
function generateOverallRecommendation(soilQuality, phInfo, carbonInfo) {
  const recommendations = [];

  if (soilQuality === "Excellent") {
    recommendations.push("Your soil is in excellent condition! Continue current management practices.");
  } else if (soilQuality === "Good") {
    recommendations.push("Your soil is in good condition. Minor improvements can optimize crop yield.");
  } else if (soilQuality === "Fair") {
    recommendations.push("Your soil needs improvement. Focus on the recommendations below.");
  } else {
    recommendations.push("Your soil requires immediate attention. Follow the recommendations carefully.");
  }

  recommendations.push(phInfo.recommendation);
  recommendations.push(carbonInfo.recommendation);

  return recommendations.join(" ");
}

export default router;
