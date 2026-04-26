import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Expert from "../models/Expert.js";

dotenv.config();
const router = express.Router();

// Expert Contact API Configuration
const CONTACT_EXPERT_API_KEY = process.env.CONTACT_EXPERT_API_KEY || "";

// Mock expert database (fallback if DB is not available)
const EXPERT_DATABASE = {
  agronomist: [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      specialization: "Crop Management",
      experience: "15 years",
      location: "Bangalore, Karnataka",
      phone: "+91-9876543210",
      email: "rajesh.kumar@agriexpert.in",
      languages: ["English", "Hindi", "Kannada"],
      rating: 4.8,
      availability: "Mon-Sat, 9 AM - 6 PM"
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Soil Health & Fertilization",
      experience: "12 years",
      location: "Pune, Maharashtra",
      phone: "+91-9876543211",
      email: "priya.sharma@agriexpert.in",
      languages: ["English", "Hindi", "Marathi"],
      rating: 4.9,
      availability: "Mon-Fri, 10 AM - 5 PM"
    }
  ],
  pathologist: [
    {
      id: 3,
      name: "Dr. Arun Patel",
      specialization: "Plant Disease Management",
      experience: "18 years",
      location: "Mysore, Karnataka",
      phone: "+91-9876543212",
      email: "arun.patel@agriexpert.in",
      languages: ["English", "Hindi", "Kannada"],
      rating: 4.7,
      availability: "Mon-Sat, 8 AM - 7 PM"
    }
  ],
  entomologist: [
    {
      id: 4,
      name: "Dr. Meena Reddy",
      specialization: "Pest Control & IPM",
      experience: "10 years",
      location: "Hyderabad, Telangana",
      phone: "+91-9876543213",
      email: "meena.reddy@agriexpert.in",
      languages: ["English", "Hindi", "Telugu"],
      rating: 4.6,
      availability: "Tue-Sat, 9 AM - 6 PM"
    }
  ],
  horticulturist: [
    {
      id: 5,
      name: "Dr. Suresh Nair",
      specialization: "Fruit & Vegetable Cultivation",
      experience: "14 years",
      location: "Kochi, Kerala",
      phone: "+91-9876543214",
      email: "suresh.nair@agriexpert.in",
      languages: ["English", "Hindi", "Malayalam"],
      rating: 4.8,
      availability: "Mon-Fri, 10 AM - 6 PM"
    }
  ]
};

// GET: Get list of experts by specialization
router.get("/list", (req, res) => {
  try {
    const { specialization, location } = req.query;

    console.log(`👨‍🌾 Expert list request: ${specialization || 'all'}, Location: ${location || 'all'}`);

    let experts = [];

    if (specialization && EXPERT_DATABASE[specialization.toLowerCase()]) {
      experts = EXPERT_DATABASE[specialization.toLowerCase()];
    } else {
      // Return all experts
      experts = Object.values(EXPERT_DATABASE).flat();
    }

    // Filter by location if provided
    if (location) {
      experts = experts.filter(expert => 
        expert.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    console.log(`✅ Found ${experts.length} experts`);

    res.json({
      success: true,
      count: experts.length,
      experts: experts,
      specializations: Object.keys(EXPERT_DATABASE)
    });

  } catch (error) {
    console.error("❌ Expert list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch expert list",
      message: error.message
    });
  }
});

// GET: Get expert by ID
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👨‍🌾 Expert details request: ID ${id}`);

    // Find expert in database
    let expert = null;
    for (const category of Object.values(EXPERT_DATABASE)) {
      expert = category.find(e => e.id === parseInt(id));
      if (expert) break;
    }

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: "Expert not found"
      });
    }

    console.log(`✅ Expert found: ${expert.name}`);

    res.json({
      success: true,
      expert: expert
    });

  } catch (error) {
    console.error("❌ Expert details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch expert details",
      message: error.message
    });
  }
});

// POST: Submit contact request to expert
router.post("/contact", async (req, res) => {
  try {
    const { expertId, farmerName, farmerPhone, farmerEmail, issue, preferredTime, message } = req.body;

    if (!expertId || !farmerName || !farmerPhone || !issue) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["expertId", "farmerName", "farmerPhone", "issue"]
      });
    }

    console.log(`📞 Contact request received`);
    console.log(`Expert ID: ${expertId}, Farmer: ${farmerName}`);

    // Find expert
    let expert = null;
    for (const category of Object.values(EXPERT_DATABASE)) {
      expert = category.find(e => e.id === parseInt(expertId));
      if (expert) break;
    }

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: "Expert not found"
      });
    }

    // In a real system, this would:
    // 1. Send notification to expert
    // 2. Send confirmation to farmer
    // 3. Store in database
    // 4. Schedule callback

    // For now, simulate successful submission
    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`✅ Contact request submitted: ${requestId}`);
    console.log(`Expert: ${expert.name}, Issue: ${issue}`);

    res.json({
      success: true,
      message: "Contact request submitted successfully",
      requestId: requestId,
      expert: {
        name: expert.name,
        specialization: expert.specialization,
        phone: expert.phone,
        email: expert.email
      },
      estimatedResponse: "Within 24 hours",
      status: "pending",
      submittedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Contact request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit contact request",
      message: error.message
    });
  }
});

// POST: Book consultation with expert
router.post("/book-consultation", async (req, res) => {
  try {
    const { expertId, farmerName, farmerPhone, consultationType, preferredDate, preferredTime, issue } = req.body;

    if (!expertId || !farmerName || !farmerPhone || !consultationType || !preferredDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["expertId", "farmerName", "farmerPhone", "consultationType", "preferredDate"]
      });
    }

    console.log(`📅 Consultation booking request`);
    console.log(`Expert ID: ${expertId}, Type: ${consultationType}, Date: ${preferredDate}`);

    // Find expert
    let expert = null;
    for (const category of Object.values(EXPERT_DATABASE)) {
      expert = category.find(e => e.id === parseInt(expertId));
      if (expert) break;
    }

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: "Expert not found"
      });
    }

    // Generate booking ID
    const bookingId = `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`✅ Consultation booked: ${bookingId}`);

    res.json({
      success: true,
      message: "Consultation booked successfully",
      bookingId: bookingId,
      expert: {
        name: expert.name,
        specialization: expert.specialization,
        phone: expert.phone
      },
      consultation: {
        type: consultationType,
        date: preferredDate,
        time: preferredTime || "To be confirmed",
        status: "confirmed"
      },
      instructions: "You will receive a confirmation call within 2 hours. Please keep your phone accessible.",
      bookedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to book consultation",
      message: error.message
    });
  }
});

// GET: Get expert availability
router.get("/:id/availability", (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    console.log(`📅 Availability check: Expert ${id}, Date: ${date || 'today'}`);

    // Find expert
    let expert = null;
    for (const category of Object.values(EXPERT_DATABASE)) {
      expert = category.find(e => e.id === parseInt(id));
      if (expert) break;
    }

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: "Expert not found"
      });
    }

    // Mock availability slots
    const availableSlots = [
      { time: "09:00 AM", available: true },
      { time: "10:00 AM", available: true },
      { time: "11:00 AM", available: false },
      { time: "02:00 PM", available: true },
      { time: "03:00 PM", available: true },
      { time: "04:00 PM", available: false },
      { time: "05:00 PM", available: true }
    ];

    res.json({
      success: true,
      expert: {
        id: expert.id,
        name: expert.name,
        availability: expert.availability
      },
      date: date || new Date().toISOString().split('T')[0],
      slots: availableSlots
    });

  } catch (error) {
    console.error("❌ Availability error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check availability",
      message: error.message
    });
  }
});

// POST: Initialize expert database from mock data
router.post("/init-experts", async (req, res) => {
  try {
    console.log(`👨‍🌾 Initializing expert database...`);

    // Check if experts already exist
    const existingCount = await Expert.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Database already has ${existingCount} experts`,
        count: existingCount
      });
    }

    // Convert mock data to database format
    const expertsToInsert = [];
    let expertIdCounter = 1;

    for (const [category, experts] of Object.entries(EXPERT_DATABASE)) {
      for (const expert of experts) {
        expertsToInsert.push({
          expert_id: `EXP${String(expertIdCounter).padStart(3, '0')}`,
          name: expert.name,
          specialization: expert.specialization,
          category: category,
          experience: expert.experience,
          location: {
            full: expert.location
          },
          contact: {
            phone: expert.phone,
            email: expert.email
          },
          languages: expert.languages,
          rating: {
            average: expert.rating,
            total_reviews: Math.floor(Math.random() * 100) + 50
          },
          availability: expert.availability,
          consultation_fee: {
            phone: 200,
            video: 500,
            visit: 1000
          },
          verified: true,
          active: true
        });
        expertIdCounter++;
      }
    }

    // Insert experts into database
    const result = await Expert.insertMany(expertsToInsert);

    console.log(`✅ Inserted ${result.length} experts into database`);

    res.json({
      success: true,
      message: `Successfully inserted ${result.length} experts`,
      count: result.length,
      experts: result.map(e => ({ id: e.expert_id, name: e.name, category: e.category }))
    });

  } catch (error) {
    console.error("❌ Init experts error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize experts',
      message: error.message
    });
  }
});

export default router;
