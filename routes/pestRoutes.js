import express from "express";
import PestDetection from "../models/PestDetection.js";
import { translateTerm } from "../utils/translations.js";


const router = express.Router();

// Comprehensive Pest Database
const PEST_DATABASE = {
  "Rice": [
    {
      name: "Rice Leaf Folder",
      scientificName: "Cnaphalocrocis medinalis",
      description: "A common pest that folds rice leaves and feeds inside, causing significant damage to the crop.",
      symptoms: ["leaf damage", "holes in leaves", "rolled leaves", "folded leaves"],
      severity: "moderate",
      affectedCrops: ["Rice"],
      treatment: [
        "Apply chlorantraniliprole or flubendiamide",
        "Use light traps to monitor adult moths",
        "Maintain proper water management",
        "Remove and destroy affected leaves"
      ],
      prevention: [
        "Avoid excessive nitrogen fertilization",
        "Maintain proper plant spacing",
        "Use resistant varieties"
      ]
    },
    {
      name: "Brown Plant Hopper",
      scientificName: "Nilaparvata lugens",
      description: "A serious pest that sucks plant sap, causing yellowing, wilting, and hopper burn.",
      symptoms: ["yellowing leaves", "wilting", "stunted growth", "brown patches", "hopper burn"],
      severity: "high",
      affectedCrops: ["Rice"],
      treatment: [
        "Apply imidacloprid or thiamethoxam",
        "Drain water from field for 2-3 days",
        "Use resistant varieties",
        "Apply neem oil spray"
      ],
      prevention: [
        "Avoid excessive nitrogen fertilizer",
        "Maintain proper plant spacing",
        "Remove weeds regularly"
      ]
    },
    {
      name: "Stem Borer",
      scientificName: "Scirpophaga incertulas",
      description: "Larvae bore into rice stems causing dead hearts in vegetative stage and white ears in reproductive stage.",
      symptoms: ["stem boring", "dead hearts", "white ears", "wilting"],
      severity: "high",
      affectedCrops: ["Rice"],
      treatment: [
        "Apply cartap hydrochloride or chlorantraniliprole",
        "Remove and destroy affected tillers",
        "Use pheromone traps",
        "Release egg parasitoids"
      ],
      prevention: [
        "Use resistant varieties",
        "Avoid staggered planting",
        "Maintain field sanitation"
      ]
    },
    {
      name: "Rice Gall Midge",
      scientificName: "Orseolia oryzae",
      description: "Larvae feed on growing shoot causing formation of tubular galls (silver shoots).",
      symptoms: ["stunted growth", "silver shoots", "gall formation"],
      severity: "moderate",
      affectedCrops: ["Rice"],
      treatment: [
        "Apply carbofuran or fipronil",
        "Remove and destroy galls",
        "Use resistant varieties"
      ],
      prevention: [
        "Use resistant varieties",
        "Avoid early planting",
        "Maintain proper spacing"
      ]
    }
  ],
  "Wheat": [
    {
      name: "Aphids",
      scientificName: "Rhopalosiphum maidis",
      description: "Small sap-sucking insects that cause yellowing, stunted growth, and transmit viral diseases.",
      symptoms: ["yellowing leaves", "sticky residue", "stunted growth", "leaf curling"],
      severity: "moderate",
      affectedCrops: ["Wheat", "Maize"],
      treatment: [
        "Apply imidacloprid or thiamethoxam",
        "Spray neem oil solution",
        "Use yellow sticky traps",
        "Encourage natural predators"
      ],
      prevention: [
        "Avoid excessive nitrogen fertilization",
        "Maintain field hygiene",
        "Use resistant varieties"
      ]
    },
    {
      name: "Armyworm",
      scientificName: "Spodoptera litura",
      description: "Larvae feed on leaves causing extensive defoliation and crop damage.",
      symptoms: ["leaf damage", "holes in leaves", "defoliation", "skeletonized leaves"],
      severity: "high",
      affectedCrops: ["Wheat", "Maize", "Rice"],
      treatment: [
        "Apply chlorpyrifos or quinalphos",
        "Handpick and destroy larvae",
        "Use pheromone traps",
        "Apply neem-based pesticides"
      ],
      prevention: [
        "Deep plowing after harvest",
        "Remove crop residues",
        "Monitor regularly"
      ]
    },
    {
      name: "Termites",
      scientificName: "Odontotermes obesus",
      description: "Soil-dwelling insects that damage roots and stems, causing wilting and plant death.",
      symptoms: ["root damage", "wilting", "plant death", "mud tubes"],
      severity: "critical",
      affectedCrops: ["Wheat", "Sugarcane", "Maize"],
      treatment: [
        "Apply chlorpyrifos at sowing",
        "Drench soil with fipronil",
        "Remove and destroy affected plants",
        "Use termite-resistant varieties"
      ],
      prevention: [
        "Deep summer plowing",
        "Remove crop residues",
        "Treat seeds before sowing"
      ]
    }
  ],
  "Cotton": [
    {
      name: "Cotton Bollworm",
      scientificName: "Helicoverpa armigera",
      description: "A major pest that damages bolls, flowers, and young shoots, causing significant yield loss.",
      symptoms: ["fruit damage", "holes in bolls", "damaged flowers", "boll shedding"],
      severity: "critical",
      affectedCrops: ["Cotton", "Tomato", "Chili"],
      treatment: [
        "Apply emamectin benzoate or spinosad",
        "Use pheromone traps",
        "Release egg parasitoids",
        "Apply neem-based pesticides"
      ],
      prevention: [
        "Use Bt cotton varieties",
        "Intercrop with non-host crops",
        "Monitor regularly"
      ]
    },
    {
      name: "Whitefly",
      scientificName: "Bemisia tabaci",
      description: "Small white flying insects that suck plant sap and transmit viral diseases.",
      symptoms: ["yellowing leaves", "sticky residue", "leaf curling", "sooty mold"],
      severity: "high",
      affectedCrops: ["Cotton", "Tomato", "Brinjal", "Chili"],
      treatment: [
        "Apply imidacloprid or thiamethoxam",
        "Use yellow sticky traps",
        "Spray neem oil",
        "Remove heavily infested leaves"
      ],
      prevention: [
        "Use resistant varieties",
        "Maintain field hygiene",
        "Avoid excessive nitrogen"
      ]
    },
    {
      name: "Jassids",
      scientificName: "Amrasca biguttula",
      description: "Leaf hoppers that suck sap from leaves causing yellowing and curling (hopper burn).",
      symptoms: ["yellowing leaves", "leaf curling", "hopper burn", "stunted growth"],
      severity: "moderate",
      affectedCrops: ["Cotton", "Brinjal"],
      treatment: [
        "Apply imidacloprid or acetamiprid",
        "Spray neem oil",
        "Use yellow sticky traps"
      ],
      prevention: [
        "Use resistant varieties",
        "Maintain proper spacing",
        "Monitor regularly"
      ]
    },
    {
      name: "Aphids",
      scientificName: "Aphis gossypii",
      description: "Sap-sucking insects that cause leaf curling and transmit viral diseases.",
      symptoms: ["yellowing leaves", "sticky residue", "leaf curling"],
      severity: "moderate",
      affectedCrops: ["Cotton", "Chili", "Brinjal"],
      treatment: [
        "Apply imidacloprid",
        "Spray neem oil",
        "Encourage natural predators"
      ],
      prevention: [
        "Avoid excessive nitrogen",
        "Maintain field hygiene"
      ]
    }
  ],
  "Tomato": [
    {
      name: "Fruit Borer",
      scientificName: "Helicoverpa armigera",
      description: "Larvae bore into fruits causing damage and making them unmarketable.",
      symptoms: ["fruit damage", "holes in fruits", "damaged flowers"],
      severity: "high",
      affectedCrops: ["Tomato", "Chili", "Brinjal"],
      treatment: [
        "Apply emamectin benzoate or spinosad",
        "Remove and destroy affected fruits",
        "Use pheromone traps",
        "Apply neem-based pesticides"
      ],
      prevention: [
        "Use resistant varieties",
        "Monitor regularly",
        "Maintain field hygiene"
      ]
    },
    {
      name: "Whitefly",
      scientificName: "Bemisia tabaci",
      description: "Transmits tomato leaf curl virus and causes yellowing and stunted growth.",
      symptoms: ["yellowing leaves", "sticky residue", "leaf curling", "stunted growth"],
      severity: "moderate",
      affectedCrops: ["Tomato", "Cotton", "Brinjal"],
      treatment: [
        "Apply imidacloprid or thiamethoxam",
        "Use yellow sticky traps",
        "Spray neem oil",
        "Remove infected plants"
      ],
      prevention: [
        "Use virus-resistant varieties",
        "Maintain field hygiene",
        "Use reflective mulches"
      ]
    },
    {
      name: "Leaf Miner",
      scientificName: "Liriomyza trifolii",
      description: "Larvae mine through leaves creating serpentine tunnels, reducing photosynthesis.",
      symptoms: ["leaf damage", "serpentine mines on leaves", "white trails"],
      severity: "low",
      affectedCrops: ["Tomato", "Potato", "Brinjal"],
      treatment: [
        "Apply abamectin or spinosad",
        "Remove and destroy affected leaves",
        "Use yellow sticky traps"
      ],
      prevention: [
        "Maintain field hygiene",
        "Use resistant varieties",
        "Monitor regularly"
      ]
    },
    {
      name: "Aphids",
      scientificName: "Myzus persicae",
      description: "Sap-sucking insects that cause leaf curling and transmit viral diseases.",
      symptoms: ["yellowing leaves", "sticky residue", "leaf curling"],
      severity: "moderate",
      affectedCrops: ["Tomato", "Chili", "Potato"],
      treatment: [
        "Apply imidacloprid",
        "Spray neem oil",
        "Encourage ladybugs"
      ],
      prevention: [
        "Avoid excessive nitrogen",
        "Maintain field hygiene"
      ]
    }
  ],
  "Potato": [
    {
      name: "Aphids",
      scientificName: "Myzus persicae",
      description: "Transmits potato viruses and causes yellowing and stunted growth.",
      symptoms: ["yellowing leaves", "sticky residue", "stunted growth"],
      severity: "moderate",
      affectedCrops: ["Potato", "Tomato"],
      treatment: [
        "Apply imidacloprid",
        "Spray neem oil",
        "Use reflective mulches"
      ],
      prevention: [
        "Use virus-free seed potatoes",
        "Maintain field hygiene"
      ]
    },
    {
      name: "Cutworm",
      scientificName: "Agrotis ipsilon",
      description: "Larvae cut stems at ground level causing plant wilting and death.",
      symptoms: ["stem cutting at ground level", "wilting", "plant death"],
      severity: "moderate",
      affectedCrops: ["Potato", "Tomato", "Cabbage"],
      treatment: [
        "Apply chlorpyrifos",
        "Handpick larvae at night",
        "Use poison baits"
      ],
      prevention: [
        "Deep plowing",
        "Remove weeds",
        "Use collar protection"
      ]
    }
  ],
  "Maize": [
    {
      name: "Fall Armyworm",
      scientificName: "Spodoptera frugiperda",
      description: "Highly destructive pest that feeds on leaves and developing cobs.",
      symptoms: ["leaf damage", "holes in leaves", "damaged cobs"],
      severity: "critical",
      affectedCrops: ["Maize", "Sugarcane"],
      treatment: [
        "Apply emamectin benzoate or chlorantraniliprole",
        "Handpick egg masses and larvae",
        "Use pheromone traps"
      ],
      prevention: [
        "Early planting",
        "Intercropping",
        "Regular monitoring"
      ]
    },
    {
      name: "Stem Borer",
      scientificName: "Chilo partellus",
      description: "Larvae bore into stems causing dead hearts and reduced yield.",
      symptoms: ["stem boring", "dead hearts", "wilting"],
      severity: "high",
      affectedCrops: ["Maize", "Sugarcane"],
      treatment: [
        "Apply carbofuran or cartap hydrochloride",
        "Remove and destroy affected plants"
      ],
      prevention: [
        "Use resistant varieties",
        "Maintain field sanitation"
      ]
    }
  ],
  "Cabbage": [
    {
      name: "Cabbage Butterfly",
      scientificName: "Pieris brassicae",
      description: "Larvae feed on leaves causing extensive damage to cabbage crops.",
      symptoms: ["holes in leaves", "leaf damage", "defoliation"],
      severity: "moderate",
      affectedCrops: ["Cabbage", "Cauliflower", "Brinjal"],
      treatment: [
        "Apply Bacillus thuringiensis (Bt)",
        "Handpick larvae",
        "Use neem-based pesticides"
      ],
      prevention: [
        "Use row covers",
        "Maintain field hygiene",
        "Encourage natural predators"
      ]
    },
    {
      name: "Diamondback Moth",
      scientificName: "Plutella xylostella",
      description: "Small moth whose larvae feed on leaves creating holes and reducing quality.",
      symptoms: ["holes in leaves", "leaf damage", "window paning"],
      severity: "moderate",
      affectedCrops: ["Cabbage", "Cauliflower"],
      treatment: [
        "Apply spinosad or emamectin benzoate",
        "Use pheromone traps",
        "Apply Bt spray"
      ],
      prevention: [
        "Rotate crops",
        "Use resistant varieties",
        "Monitor regularly"
      ]
    }
  ],
  "Sugarcane": [
    {
      name: "Early Shoot Borer",
      scientificName: "Chilo infuscatellus",
      description: "Larvae bore into young shoots causing dead hearts and reduced tillering.",
      symptoms: ["stem boring", "dead hearts", "wilting", "reduced tillering"],
      severity: "high",
      affectedCrops: ["Sugarcane"],
      treatment: [
        "Apply carbofuran at planting",
        "Remove and destroy affected shoots",
        "Use pheromone traps"
      ],
      prevention: [
        "Use resistant varieties",
        "Treat setts before planting",
        "Maintain field sanitation"
      ]
    },
    {
      name: "Whitefly",
      scientificName: "Aleurolobus barodensis",
      description: "Sucks sap from leaves causing yellowing and sooty mold development.",
      symptoms: ["yellowing leaves", "sticky residue", "sooty mold"],
      severity: "moderate",
      affectedCrops: ["Sugarcane"],
      treatment: [
        "Apply imidacloprid",
        "Spray neem oil",
        "Remove heavily infested leaves"
      ],
      prevention: [
        "Maintain field hygiene",
        "Use resistant varieties"
      ]
    }
  ],
  "Onion": [
    {
      name: "Thrips",
      scientificName: "Thrips tabaci",
      description: "Tiny insects that feed on leaves causing silvering and reduced bulb size.",
      symptoms: ["black spots", "leaf damage", "silvering", "stunted growth"],
      severity: "low",
      affectedCrops: ["Onion", "Chili"],
      treatment: [
        "Apply fipronil or spinosad",
        "Use blue sticky traps",
        "Spray neem oil"
      ],
      prevention: [
        "Maintain field hygiene",
        "Use resistant varieties",
        "Avoid water stress"
      ]
    }
  ],
  "Chili": [
    {
      name: "Fruit Borer",
      scientificName: "Helicoverpa armigera",
      description: "Larvae bore into fruits causing damage and making them unmarketable.",
      symptoms: ["fruit damage", "holes in fruits"],
      severity: "high",
      affectedCrops: ["Chili", "Tomato"],
      treatment: [
        "Apply emamectin benzoate",
        "Remove affected fruits",
        "Use pheromone traps"
      ],
      prevention: [
        "Monitor regularly",
        "Maintain field hygiene"
      ]
    },
    {
      name: "Aphids",
      scientificName: "Myzus persicae",
      description: "Sap-sucking insects that transmit viral diseases.",
      symptoms: ["yellowing leaves", "sticky residue", "leaf curling"],
      severity: "moderate",
      affectedCrops: ["Chili", "Tomato"],
      treatment: [
        "Apply imidacloprid",
        "Spray neem oil"
      ],
      prevention: [
        "Maintain field hygiene",
        "Use resistant varieties"
      ]
    }
  ],
  "Brinjal": [
    {
      name: "Fruit and Shoot Borer",
      scientificName: "Leucinodes orbonalis",
      description: "Larvae bore into shoots and fruits causing wilting and fruit damage.",
      symptoms: ["fruit damage", "shoot wilting", "holes in fruits"],
      severity: "high",
      affectedCrops: ["Brinjal"],
      treatment: [
        "Apply emamectin benzoate or spinosad",
        "Remove and destroy affected parts",
        "Use pheromone traps"
      ],
      prevention: [
        "Use resistant varieties",
        "Monitor regularly",
        "Remove crop residues"
      ]
    },
    {
      name: "Whitefly",
      scientificName: "Bemisia tabaci",
      description: "Transmits viral diseases and causes yellowing.",
      symptoms: ["yellowing leaves", "sticky residue", "leaf curling"],
      severity: "moderate",
      affectedCrops: ["Brinjal", "Tomato"],
      treatment: [
        "Apply imidacloprid",
        "Use yellow sticky traps",
        "Spray neem oil"
      ],
      prevention: [
        "Use resistant varieties",
        "Maintain field hygiene"
      ]
    }
  ],
  "Cauliflower": [
    {
      name: "Diamondback Moth",
      scientificName: "Plutella xylostella",
      description: "Larvae feed on leaves creating holes.",
      symptoms: ["holes in leaves", "leaf damage"],
      severity: "moderate",
      affectedCrops: ["Cauliflower", "Cabbage"],
      treatment: [
        "Apply spinosad",
        "Use Bt spray",
        "Use pheromone traps"
      ],
      prevention: [
        "Rotate crops",
        "Monitor regularly"
      ]
    }
  ]
};

// Supported crops list
const SUPPORTED_CROPS = [
  "Rice", "Wheat", "Maize", "Cotton", "Sugarcane",
  "Tomato", "Potato", "Onion", "Chili", "Brinjal",
  "Cabbage", "Cauliflower"
];

/**
 * Detect pest based on crop and symptoms
 * @param {string} crop - Crop name
 * @param {string} symptoms - Comma-separated symptoms
 * @returns {object|null} Detected pest or null
 */
function detectPest(crop, symptoms) {
  // Normalize crop name
  const normalizedCrop = crop.trim();

  // Get pests for this crop
  const cropPests = PEST_DATABASE[normalizedCrop];
  if (!cropPests) {
    return null;
  }

  // Normalize symptoms to lowercase
  const symptomsLower = symptoms.toLowerCase();

  // Score each pest based on symptom matches
  const pestScores = [];

  for (const pest of cropPests) {
    let score = 0;
    let matchedSymptoms = [];

    for (const symptom of pest.symptoms) {
      if (symptomsLower.includes(symptom.toLowerCase())) {
        score++;
        matchedSymptoms.push(symptom);
      }
    }

    if (score > 0) {
      pestScores.push({
        score,
        matchedSymptoms,
        pest
      });
    }
  }

  // Return pest with highest score
  if (pestScores.length > 0) {
    pestScores.sort((a, b) => b.score - a.score);
    return pestScores[0].pest;
  }

  return null;
}

// POST: Detect pest based on crop and symptoms
router.post("/detect", async (req, res) => {
  try {
    let { crop, symptoms, language } = req.body;

    // Validation: Check if fields are present
    if (!crop || !symptoms) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both crop and symptoms are required"
      });
    }

    // Validation: Check if values are strings
    if (typeof crop !== 'string' || typeof symptoms !== 'string') {
      return res.status(400).json({
        error: "Invalid input parameters",
        message: "Crop and symptoms must be strings"
      });
    }

    // Normalize crop name (capitalize first letter)
    crop = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();

    // Validation: Check if crop is supported
    if (!SUPPORTED_CROPS.includes(crop)) {
      return res.status(400).json({
        error: "Invalid crop type",
        message: `The specified crop is not supported. Supported crops: ${SUPPORTED_CROPS.join(', ')}`
      });
    }

    console.log(`🐛 Detecting pest for crop: ${crop}, symptoms: ${symptoms}`);

    // Detect pest
    const detectedPest = detectPest(crop, symptoms);

    // Save to database for analytics
    try {
      const detectionId = `PEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const pestDetectionDoc = new PestDetection({
        detection_id: detectionId,
        crop: crop,
        symptoms: symptoms,
        detected_pest: detectedPest ? {
          name: detectedPest.name,
          scientific_name: detectedPest.scientificName,
          severity: detectedPest.severity,
          description: detectedPest.description
        } : null,
        treatment_provided: detectedPest ? detectedPest.treatment : [],
        prevention_provided: detectedPest ? detectedPest.prevention : [],
        detection_success: !!detectedPest,
        user_info: {
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent')
        }
      });

      await pestDetectionDoc.save();
      console.log(`✅ Pest detection saved: ${detectionId}`);
    } catch (dbError) {
      console.error("⚠️  Database save failed (non-critical):", dbError.message);
      // Continue even if DB save fails
    }

    if (detectedPest) {
      // Pest detected - return full details
      res.json({
        pest: language === 'mr' ? translateTerm(detectedPest.name, 'mr') : detectedPest.name,
        description: detectedPest.description,
        scientificName: detectedPest.scientificName,
        severity: language === 'mr' ? translateTerm(detectedPest.severity, 'mr') : detectedPest.severity,
        affectedCrops: detectedPest.affectedCrops,
        treatment: detectedPest.treatment,
        prevention: detectedPest.prevention,
        message: language === 'mr' ? "कीटक यशस्वीरित्या ओळखला गेला" : "Pest detected successfully"
      });

      console.log(`✅ Pest detected: ${detectedPest.name} (${detectedPest.severity})`);
    } else {
      // No pest detected
      res.json({
        pest: language === 'mr' ? "कोणताही कीटक आढळला नाही" : "No pest detected",
        message: language === 'mr' ? "दिलेल्या लक्षणांच्या आधारे कोणताही विशिष्ट कीटक ओळखला गेला नाही. तुमच्या पिकांवर लक्ष ठेवणे सुरू ठेवा." : "Based on the symptoms provided, no specific pest was identified. Continue monitoring your crops.",
        recommendation: language === 'mr' ? "नियमित पीक तपासणी आणि शेतीची स्वच्छता राखा" : "Maintain regular crop inspection and field hygiene"
      });

      console.log(`⚠️  No pest detected for ${crop} with symptoms: ${symptoms}`);
    }

  } catch (error) {
    console.error("❌ Pest detection error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to process pest detection request"
    });
  }
});

// GET: List all supported crops
router.get("/crops", (req, res) => {
  res.json({
    supportedCrops: SUPPORTED_CROPS,
    totalCrops: SUPPORTED_CROPS.length,
    message: "List of supported crops for pest detection"
  });
});

// GET: Get all pests for a specific crop
router.get("/crop/:cropName", (req, res) => {
  try {
    let { cropName } = req.params;

    // Normalize crop name
    cropName = cropName.charAt(0).toUpperCase() + cropName.slice(1).toLowerCase();

    const cropPests = PEST_DATABASE[cropName];

    if (!cropPests) {
      return res.status(404).json({
        error: "Crop not found",
        message: `No pest data available for ${cropName}`
      });
    }

    res.json({
      crop: cropName,
      pests: cropPests.map(p => ({
        name: p.name,
        scientificName: p.scientificName,
        severity: p.severity
      })),
      totalPests: cropPests.length,
      message: `Pest data for ${cropName}`
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

export default router;
