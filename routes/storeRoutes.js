import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Store from "../models/Store.js";

dotenv.config();
const router = express.Router();

// Helper function: Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const deltaLat = (lat2 - lat1) * Math.PI / 180;
  const deltaLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

// Helper function: Format store type
function formatStoreType(typeCode) {
  const typeMap = {
    'seeds': 'Seeds & Nursery',
    'fertilizers': 'Fertilizers',
    'pesticides': 'Pesticides',
    'equipment': 'Farm Equipment',
    'organic': 'Organic Products',
    'seeds_fertilizers': 'Seeds & Fertilizers',
    'all': 'All Products'
  };
  return typeMap[typeCode] || 'Agricultural Store';
}

// Helper function: Get today's hours
function getTodayHours(hours) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  return hours[today] || 'Hours not available';
}

// Helper function: Check if store is open
function isStoreOpen(hours) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayHours = hours[today] || '';
  
  return todayHours !== 'Closed' && todayHours !== '';
}

// POST: Find nearby stores
router.post("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius, store_type } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const searchRadius = parseInt(radius) || 10; // Default 10 km

    console.log(`🏪 Nearby stores request`);
    console.log(`📍 Location: ${lat}, ${lon}`);
    console.log(`📏 Radius: ${searchRadius} km`);
    console.log(`🏷️  Type: ${store_type || 'all'}`);

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: searchRadius * 1000 // Convert km to meters
        }
      }
    };

    // Add store type filter if provided
    if (store_type && store_type !== 'all') {
      query.type = store_type;
    }

    // Find nearby stores
    const stores = await Store.find(query).limit(50);

    // Format response
    const resultStores = stores.map(store => {
      const distance = calculateDistance(
        lat, lon,
        store.location.coordinates[1],
        store.location.coordinates[0]
      );

      return {
        id: store.store_id,
        name: store.name,
        type: formatStoreType(store.type),
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        address: store.address.full,
        phone: store.contact.phone,
        latitude: store.location.coordinates[1],
        longitude: store.location.coordinates[0],
        products: store.products || [],
        rating: store.rating.average,
        reviews: store.rating.total_reviews,
        open_hours: getTodayHours(store.hours || {}),
        is_open: isStoreOpen(store.hours || {})
      };
    });

    // Sort by distance
    resultStores.sort((a, b) => a.distance - b.distance);

    console.log(`✅ Found ${resultStores.length} stores`);

    res.json({
      success: true,
      stores: resultStores,
      count: resultStores.length,
      message: `Found ${resultStores.length} stores within ${searchRadius} km`
    });

  } catch (error) {
    console.error("❌ Nearby stores error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nearby stores',
      message: error.message
    });
  }
});

// GET: Get store by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏪 Store details request: ${id}`);

    const store = await Store.findOne({ store_id: id });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    console.log(`✅ Store found: ${store.name}`);

    res.json({
      success: true,
      store: {
        id: store.store_id,
        name: store.name,
        type: formatStoreType(store.type),
        address: store.address,
        contact: store.contact,
        location: {
          latitude: store.location.coordinates[1],
          longitude: store.location.coordinates[0]
        },
        products: store.products,
        rating: store.rating,
        hours: store.hours,
        verified: store.verified
      }
    });

  } catch (error) {
    console.error("❌ Store details error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store details',
      message: error.message
    });
  }
});

// GET: Get all store categories
router.get("/categories/list", async (req, res) => {
  try {
    console.log(`📋 Store categories request`);

    const categories = [
      { id: 'seeds', name: 'Seeds & Nursery', icon: '🌱' },
      { id: 'fertilizers', name: 'Fertilizers', icon: '🧪' },
      { id: 'pesticides', name: 'Pesticides', icon: '🐛' },
      { id: 'equipment', name: 'Farm Equipment', icon: '🚜' },
      { id: 'organic', name: 'Organic Products', icon: '🌿' },
      { id: 'seeds_fertilizers', name: 'Seeds & Fertilizers', icon: '🌾' },
      { id: 'all', name: 'All Products', icon: '🏪' }
    ];

    res.json({
      success: true,
      categories: categories
    });

  } catch (error) {
    console.error("❌ Categories error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// POST: Initialize sample store data
router.post("/init-sample-data", async (req, res) => {
  try {
    console.log(`🏪 Initializing sample store data...`);

    // Check if stores already exist
    const existingCount = await Store.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Database already has ${existingCount} stores`,
        count: existingCount
      });
    }

    // Sample stores data
    const sampleStores = [
      {
        store_id: "STORE001",
        name: "Krishi Kendra Seeds & Fertilizers",
        type: "seeds_fertilizers",
        location: {
          type: "Point",
          coordinates: [77.5980, 12.9750] // Bangalore MG Road
        },
        address: {
          street: "MG Road",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
          full: "MG Road, Bangalore, Karnataka 560001"
        },
        contact: {
          phone: "+91 9876543210",
          email: "info@krishikendra.com",
          website: "www.krishikendra.com"
        },
        products: ["Seeds", "Fertilizers", "Pesticides", "Farm Tools"],
        rating: {
          average: 4.5,
          total_reviews: 120
        },
        hours: {
          monday: "9:00 AM - 7:00 PM",
          tuesday: "9:00 AM - 7:00 PM",
          wednesday: "9:00 AM - 7:00 PM",
          thursday: "9:00 AM - 7:00 PM",
          friday: "9:00 AM - 7:00 PM",
          saturday: "9:00 AM - 5:00 PM",
          sunday: "Closed"
        },
        verified: true
      },
      {
        store_id: "STORE002",
        name: "Green Valley Organic Store",
        type: "organic",
        location: {
          type: "Point",
          coordinates: [77.5833, 12.9250] // Jayanagar
        },
        address: {
          street: "4th Block",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560011",
          full: "Jayanagar 4th Block, Bangalore 560011"
        },
        contact: {
          phone: "+91 9876543211",
          email: "contact@greenvalley.com"
        },
        products: ["Organic Seeds", "Bio-Fertilizers", "Compost", "Organic Pesticides"],
        rating: {
          average: 4.8,
          total_reviews: 95
        },
        hours: {
          monday: "8:00 AM - 8:00 PM",
          tuesday: "8:00 AM - 8:00 PM",
          wednesday: "8:00 AM - 8:00 PM",
          thursday: "8:00 AM - 8:00 PM",
          friday: "8:00 AM - 8:00 PM",
          saturday: "8:00 AM - 6:00 PM",
          sunday: "10:00 AM - 4:00 PM"
        },
        verified: true
      },
      {
        store_id: "STORE003",
        name: "Farmers Equipment Hub",
        type: "equipment",
        location: {
          type: "Point",
          coordinates: [77.6100, 12.9800] // Whitefield
        },
        address: {
          full: "Whitefield Main Road, Bangalore 560066"
        },
        contact: {
          phone: "+91 9876543212"
        },
        products: ["Tractors", "Tillers", "Sprayers", "Harvesters"],
        rating: {
          average: 4.3,
          total_reviews: 78
        },
        hours: {
          monday: "9:00 AM - 6:00 PM",
          tuesday: "9:00 AM - 6:00 PM",
          wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "9:00 AM - 3:00 PM",
          sunday: "Closed"
        },
        verified: true
      },
      {
        store_id: "STORE004",
        name: "Agro Seeds Mart",
        type: "seeds",
        location: {
          type: "Point",
          coordinates: [77.5700, 12.9600] // Koramangala
        },
        address: {
          full: "Koramangala 5th Block, Bangalore 560095"
        },
        contact: {
          phone: "+91 9876543213"
        },
        products: ["Vegetable Seeds", "Flower Seeds", "Fruit Seeds", "Hybrid Seeds"],
        rating: {
          average: 4.6,
          total_reviews: 150
        },
        hours: {
          monday: "9:00 AM - 7:00 PM",
          tuesday: "9:00 AM - 7:00 PM",
          wednesday: "9:00 AM - 7:00 PM",
          thursday: "9:00 AM - 7:00 PM",
          friday: "9:00 AM - 7:00 PM",
          saturday: "9:00 AM - 6:00 PM",
          sunday: "Closed"
        },
        verified: true
      },
      {
        store_id: "STORE005",
        name: "Pesticide Solutions Center",
        type: "pesticides",
        location: {
          type: "Point",
          coordinates: [77.5500, 12.9900] // Yeshwanthpur
        },
        address: {
          full: "Yeshwanthpur, Bangalore 560022"
        },
        contact: {
          phone: "+91 9876543214"
        },
        products: ["Insecticides", "Fungicides", "Herbicides", "Bio-Pesticides"],
        rating: {
          average: 4.4,
          total_reviews: 88
        },
        hours: {
          monday: "9:00 AM - 7:00 PM",
          tuesday: "9:00 AM - 7:00 PM",
          wednesday: "9:00 AM - 7:00 PM",
          thursday: "9:00 AM - 7:00 PM",
          friday: "9:00 AM - 7:00 PM",
          saturday: "9:00 AM - 5:00 PM",
          sunday: "Closed"
        },
        verified: true
      }
    ];

    // Insert sample stores
    const result = await Store.insertMany(sampleStores);

    console.log(`✅ Inserted ${result.length} sample stores`);

    res.json({
      success: true,
      message: `Successfully inserted ${result.length} sample stores`,
      count: result.length,
      stores: result.map(s => ({ id: s.store_id, name: s.name }))
    });

  } catch (error) {
    console.error("❌ Init sample data error:", error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize sample data',
      message: error.message
    });
  }
});

export default router;
