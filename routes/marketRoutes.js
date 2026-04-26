import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Market API Configuration
const MARKET_API_KEY = process.env.MARKET_API_KEY || "";
const MARKET_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

// Call real Market API (data.gov.in)
async function fetchRealMarketPrices(commodity, state) {
  try {
    console.log(`📊 Fetching market prices for: ${commodity || 'all'} in ${state || 'all states'}`);
    
    if (!MARKET_API_KEY) {
      console.log("⚠️  No market API key, using demo data");
      return { success: false, error: "No API key" };
    }

    const params = {
      'api-key': MARKET_API_KEY,
      format: 'json',
      limit: 50
    };

    if (commodity) {
      params.filters = JSON.stringify({ commodity: commodity });
    }
    if (state) {
      params.filters = JSON.stringify({ ...JSON.parse(params.filters || '{}'), state: state });
    }

    const response = await axios.get(MARKET_API_URL, {
      params: params,
      timeout: 10000
    });

    if (response.data && response.data.records) {
      console.log(`✅ Market data fetched: ${response.data.records.length} records`);
      return { success: true, data: response.data.records };
    }

    return { success: false, error: "No data found" };
  } catch (error) {
    console.error("❌ Market API error:", error.message);
    return { success: false, error: error.message };
  }
}

// GET: Get market prices (old endpoint)
router.get("/prices", async (req, res) => {
  try {
    const { commodity, state } = req.query;
    
    // Try real API first
    const apiResult = await fetchRealMarketPrices(commodity, state);
    
    if (apiResult.success && apiResult.data.length > 0) {
      // Format real API data
      const prices = apiResult.data.map(record => ({
        crop: record.commodity,
        pricePerQuintal: parseFloat(record.modal_price) || 0,
        market: record.market,
        state: record.state,
        district: record.district,
        minPrice: parseFloat(record.min_price) || 0,
        maxPrice: parseFloat(record.max_price) || 0,
        arrivalDate: record.arrival_date,
        source: 'data.gov.in'
      }));

      return res.json({ prices, source: 'real_api' });
    }
    
    // Fallback to demo data
    console.log("⚠️  Using demo market data");
    const prices = [
      { crop: "Rice", pricePerQuintal: 2800, market: "Demo Market", state: "Karnataka" },
      { crop: "Wheat", pricePerQuintal: 2400, market: "Demo Market", state: "Karnataka" },
      { crop: "Maize", pricePerQuintal: 2200, market: "Demo Market", state: "Karnataka" },
    ];

    res.json({ prices, source: 'demo_data' });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// GET: Get market prices (new endpoint for frontend)
router.get("/market-prices", async (req, res) => {
  try {
    const { state } = req.query;
    
    // Try to fetch real data for common crops
    const crops = ['Tomato', 'Onion', 'Potato', 'Rice', 'Wheat'];
    const marketPrices = {};
    
    if (MARKET_API_KEY) {
      console.log("📊 Fetching real market prices for multiple crops...");
      
      for (const crop of crops) {
        const result = await fetchRealMarketPrices(crop, state);
        
        if (result.success && result.data.length > 0) {
          const record = result.data[0]; // Get first record
          const cropKey = crop.toLowerCase();
          
          marketPrices[cropKey] = {
            price: parseFloat(record.modal_price) || 0,
            change: 0, // Calculate from historical data if available
            market: record.market || "Unknown Market",
            state: record.state,
            minPrice: parseFloat(record.min_price) || 0,
            maxPrice: parseFloat(record.max_price) || 0,
            date: record.arrival_date,
            source: 'real_api'
          };
        }
      }
    }
    
    // If no real data or API key missing, use demo data
    if (Object.keys(marketPrices).length === 0) {
      console.log("⚠️  Using demo market prices");
      marketPrices.tomato = { price: 25, change: +5, market: "Bangalore APMC", source: 'demo' };
      marketPrices.onion = { price: 18, change: -2, market: "Mysore Mandi", source: 'demo' };
      marketPrices.potato = { price: 22, change: +3, market: "Hassan Market", source: 'demo' };
      marketPrices.rice = { price: 2800, change: +50, market: "Mandya APMC", source: 'demo' };
      marketPrices.wheat = { price: 2200, change: -30, market: "Tumkur Mandi", source: 'demo' };
    }

    res.json(marketPrices);
  } catch (error) {
    console.error("❌ Market prices error:", error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

export default router;
