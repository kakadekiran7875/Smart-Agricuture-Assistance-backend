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
      timeout: 4000
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

// GET: Get market prices
router.get("/prices", async (req, res) => {
  try {
    const { commodity, state } = req.query;
    
    // Standard base commodity dictionary with realistic default rates
    const commodityMap = {
      tomato: { price: 28, min: 22, max: 32, unit: "kg", mandi: "Nashik APMC", market: "Nashik APMC", state: "Maharashtra" },
      wheat: { price: 2650, min: 2400, max: 2800, unit: "quintal", mandi: "Pune APMC", market: "Pune APMC", state: "Maharashtra" },
      onion: { price: 18, min: 14, max: 22, unit: "kg", mandi: "Lasalgaon APMC", market: "Lasalgaon APMC", state: "Maharashtra" },
      potato: { price: 24, min: 20, max: 28, unit: "kg", mandi: "Kolhapur Market", market: "Kolhapur Market", state: "Maharashtra" },
      rice: { price: 3200, min: 2900, max: 3500, unit: "quintal", mandi: "Nagpur Mandi", market: "Nagpur Mandi", state: "Maharashtra" },
      cotton: { price: 7100, min: 6800, max: 7400, unit: "quintal", mandi: "Akola APMC", market: "Akola APMC", state: "Maharashtra" },
      soybean: { price: 4400, min: 4100, max: 4700, unit: "quintal", mandi: "Latur Mandi", market: "Latur Mandi", state: "Maharashtra" }
    };

    // Try real API first
    const apiResult = await fetchRealMarketPrices(commodity, state);
    
    let pricesList = [];
    if (apiResult.success && apiResult.data.length > 0) {
      pricesList = apiResult.data.map(record => {
        const cKey = record.commodity?.toLowerCase();
        if (commodityMap[cKey]) {
          commodityMap[cKey].price = parseFloat(record.modal_price) || commodityMap[cKey].price;
          commodityMap[cKey].min = parseFloat(record.min_price) || commodityMap[cKey].min;
          commodityMap[cKey].max = parseFloat(record.max_price) || commodityMap[cKey].max;
          commodityMap[cKey].mandi = record.market || commodityMap[cKey].mandi;
          commodityMap[cKey].market = record.market || commodityMap[cKey].market;
          commodityMap[cKey].state = record.state || commodityMap[cKey].state;
        }
        return {
          crop: record.commodity,
          pricePerQuintal: parseFloat(record.modal_price) || 0,
          market: record.market,
          state: record.state,
          district: record.district,
          minPrice: parseFloat(record.min_price) || 0,
          maxPrice: parseFloat(record.max_price) || 0,
          arrivalDate: record.arrival_date,
          source: 'data.gov.in'
        };
      });
    } else {
      pricesList = [
        { crop: "Tomato", pricePerQuintal: 2800, market: "Nashik APMC", state: "Maharashtra" },
        { crop: "Wheat", pricePerQuintal: 2650, market: "Pune APMC", state: "Maharashtra" },
        { crop: "Onion", pricePerQuintal: 1800, market: "Lasalgaon APMC", state: "Maharashtra" },
        { crop: "Rice", pricePerQuintal: 3200, market: "Nagpur Mandi", state: "Maharashtra" },
        { crop: "Potato", pricePerQuintal: 2400, market: "Kolhapur Market", state: "Maharashtra" }
      ];
    }

    // Return combined object with commodity dictionary & prices array
    res.json({
      ...commodityMap,
      prices: pricesList,
      source: apiResult.success ? 'real_api' : 'demo_data'
    });
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
      console.log("📊 Fetching real market prices for multiple crops in parallel...");
      
      const results = await Promise.allSettled(
        crops.map(crop => fetchRealMarketPrices(crop, state).then(res => ({ crop, res })))
      );

      for (const item of results) {
        if (item.status === 'fulfilled' && item.value.res.success && item.value.res.data.length > 0) {
          const record = item.value.res.data[0];
          const cropKey = item.value.crop.toLowerCase();
          
          marketPrices[cropKey] = {
            price: parseFloat(record.modal_price) || 0,
            change: 0,
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
