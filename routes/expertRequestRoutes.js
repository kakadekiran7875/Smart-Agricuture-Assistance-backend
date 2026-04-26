import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import ExpertRequest from "../models/ExpertRequest.js";
import Expert from "../models/Expert.js";

dotenv.config();
const router = express.Router();

// Helper function: Generate unique request ID
function generateRequestId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REQ${dateStr}${randomStr}`;
}

// Helper function: Validate phone number
function validatePhoneNumber(phone) {
  // Indian phone number format
  const pattern = /^(\+91)?[6-9]\d{9}$/;
  return pattern.test(phone.replace(/[\s-]/g, ''));
}

// Helper function: Determine priority based on issue description
function determinePriority(issueDescription) {
  const urgentKeywords = ['dying', 'dead', 'emergency', 'urgent', 'severe', 'critical'];
  const highKeywords = ['spreading', 'fast', 'quickly', 'many', 'all'];
  
  const issueLower = issueDescription.toLowerCase();
  
  if (urgentKeywords.some(keyword => issueLower.includes(keyword))) {
    return 'urgent';
  } else if (highKeywords.some(keyword => issueLower.includes(keyword))) {
    return 'high';
  } else {
    return 'normal';
  }
}

// Helper function: Find available expert
async function findAvailableExpert(cropType, language) {
  try {
    // Try to find expert who speaks the language
    let expert = await Expert.findOne({
      'availability.status': 'available',
      'languages': language
    });
    
    if (!expert) {
      // Return any available expert
      expert = await Expert.findOne({
        'availability.status': 'available'
      });
    }
    
    return expert;
  } catch (error) {
    console.error("Error finding expert:", error);
    return null;
  }
}

// Helper function: Send SMS notification (placeholder)
function sendSmsNotification(phone, requestId, expert) {
  let message = `Your expert request ${requestId} has been received. `;
  if (expert) {
    message += `Expert ${expert.name} will call you within 30 minutes.`;
  } else {
    message += `An expert will be assigned shortly.`;
  }
  
  console.log(`📱 SMS to ${phone}: ${message}`);
  // TODO: Implement actual SMS service (MSG91, Twilio, etc.)
}

// Helper function: Notify expert (placeholder)
function notifyExpert(expert, requestDoc) {
  const message = `New consultation request from ${requestDoc.farmer.name} for ${requestDoc.crop_type}. Issue: ${requestDoc.issue_description}`;
  
  console.log(`📞 Notify expert ${expert.name}: ${message}`);
  // TODO: Implement actual notification service
}

// POST: Submit expert request
router.post("/request", async (req, res) => {
  try {
    const { name, phone, cropType, issue, language, timestamp } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'phone', 'cropType', 'issue'];
    for (const field of requiredFields) {
      if (!req.body[field] || !req.body[field].toString().trim()) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Validate phone number
    const cleanPhone = phone.trim();
    if (!validatePhoneNumber(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format',
        message: 'Please provide a valid phone number'
      });
    }

    console.log(`📞 Expert request received`);
    console.log(`👨‍🌾 Farmer: ${name}, Phone: ${cleanPhone}`);
    console.log(`🌾 Crop: ${cropType}, Issue: ${issue.substring(0, 50)}...`);

    // Generate unique request ID
    const requestId = generateRequestId();

    // Find available expert
    const expert = await findAvailableExpert(cropType, language || 'en');

    // Determine priority
    const priority = determinePriority(issue);

    // Create request document
    const requestDoc = {
      request_id: requestId,
      farmer: {
        name: name,
        phone: cleanPhone,
        language: language || 'en'
      },
      crop_type: cropType,
      issue_description: issue,
      status: 'pending',
      priority: priority,
      expert_assigned: expert ? {
        expert_id: expert.expert_id,
        name: expert.name,
        phone: expert.phone,
        specialization: expert.specialization[0]
      } : null,
      timestamps: {
        created_at: new Date(),
        assigned_at: expert ? new Date() : null,
        completed_at: null
      },
      notes: [],
      follow_up_required: false
    };

    // Save to database
    const newRequest = new ExpertRequest(requestDoc);
    await newRequest.save();

    console.log(`✅ Request created: ${requestId}`);
    console.log(`🎯 Priority: ${priority}`);
    if (expert) {
      console.log(`👨‍🌾 Expert assigned: ${expert.name}`);
    }

    // Send SMS notification
    sendSmsNotification(cleanPhone, requestId, expert);

    // Notify expert
    if (expert) {
      notifyExpert(expert, requestDoc);
    }

    res.json({
      success: true,
      request_id: requestId,
      message: 'Expert request submitted successfully',
      estimated_callback_time: '30 minutes',
      priority: priority,
      expert_assigned: expert ? {
        name: expert.name,
        specialization: expert.specialization[0],
        phone: expert.phone
      } : null
    });

  } catch (error) {
    console.error("❌ Expert request error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit expert request',
      message: error.message
    });
  }
});

// GET: Get request status
router.get("/request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`📋 Request status check: ${requestId}`);

    const request = await ExpertRequest.findOne({ request_id: requestId });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    console.log(`✅ Request found: ${request.status}`);

    res.json({
      success: true,
      request: {
        request_id: request.request_id,
        status: request.status,
        priority: request.priority,
        crop_type: request.crop_type,
        expert_assigned: request.expert_assigned,
        created_at: request.timestamps.created_at,
        farmer: request.farmer
      }
    });

  } catch (error) {
    console.error("❌ Request status error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request status',
      message: error.message
    });
  }
});

// POST: Cancel request
router.post("/request/:requestId/cancel", async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`❌ Cancel request: ${requestId}`);

    const result = await ExpertRequest.updateOne(
      { request_id: requestId },
      { $set: { status: 'cancelled' } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or already cancelled'
      });
    }

    console.log(`✅ Request cancelled: ${requestId}`);

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });

  } catch (error) {
    console.error("❌ Cancel request error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel request',
      message: error.message
    });
  }
});

// GET: Get all requests (for admin/expert dashboard)
router.get("/requests/all", async (req, res) => {
  try {
    const { status, priority, limit } = req.query;

    console.log(`📋 Fetch all requests - Status: ${status || 'all'}, Priority: ${priority || 'all'}`);

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const requests = await ExpertRequest.find(query)
      .sort({ 'timestamps.created_at': -1 })
      .limit(parseInt(limit) || 50);

    console.log(`✅ Found ${requests.length} requests`);

    res.json({
      success: true,
      count: requests.length,
      requests: requests
    });

  } catch (error) {
    console.error("❌ Fetch requests error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests',
      message: error.message
    });
  }
});

// POST: Initialize sample expert data
router.post("/init-experts", async (req, res) => {
  try {
    console.log(`👨‍🌾 Initializing sample expert data...`);

    // Check if experts already exist
    const existingCount = await Expert.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Database already has ${existingCount} experts`,
        count: existingCount
      });
    }

    // Sample experts data
    const sampleExperts = [
      {
        expert_id: "EXP001",
        name: "Dr. Suresh Patil",
        phone: "+91 9876500000",
        email: "suresh.patil@agriexpert.com",
        specialization: ["Crop Diseases", "Pest Control"],
        languages: ["en", "hi", "kn", "mr"],
        experience_years: 15,
        rating: 4.8,
        total_consultations: 1250,
        availability: {
          status: "available",
          working_hours: { start: "09:00", end: "18:00" }
        },
        location: { city: "Bangalore", state: "Karnataka" }
      },
      {
        expert_id: "EXP002",
        name: "Dr. Priya Sharma",
        phone: "+91 9876500001",
        email: "priya.sharma@agriexpert.com",
        specialization: ["Organic Farming", "Soil Health"],
        languages: ["en", "hi"],
        experience_years: 12,
        rating: 4.9,
        total_consultations: 980,
        availability: {
          status: "available",
          working_hours: { start: "10:00", end: "19:00" }
        },
        location: { city: "Pune", state: "Maharashtra" }
      },
      {
        expert_id: "EXP003",
        name: "Dr. Arun Reddy",
        phone: "+91 9876500002",
        email: "arun.reddy@agriexpert.com",
        specialization: ["Irrigation", "Water Management"],
        languages: ["en", "hi", "te"],
        experience_years: 10,
        rating: 4.7,
        total_consultations: 750,
        availability: {
          status: "available",
          working_hours: { start: "09:00", end: "17:00" }
        },
        location: { city: "Hyderabad", state: "Telangana" }
      }
    ];

    // Insert sample experts
    const result = await Expert.insertMany(sampleExperts);

    console.log(`✅ Inserted ${result.length} sample experts`);

    res.json({
      success: true,
      message: `Successfully inserted ${result.length} sample experts`,
      count: result.length,
      experts: result.map(e => ({ id: e.expert_id, name: e.name }))
    });

  } catch (error) {
    console.error("❌ Init experts error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize expert data',
      message: error.message
    });
  }
});

export default router;
