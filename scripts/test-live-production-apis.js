import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const PROD_URL = 'https://smart-agricuture-assistance-backend.onrender.com';
console.log(`🚀 Testing all 12 APIs on Production Backend: ${PROD_URL}\n`);

async function runTests() {
  const results = [];

  // API 12: Health Check
  try {
    const res = await axios.get(`${PROD_URL}/health`, { timeout: 10000 });
    results.push({ id: 12, name: 'Health Check', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 12, name: 'Health Check', status: 'FAIL', error: err.message });
  }

  // API 01: Crop Disease Detection
  try {
    // Check if test image exists or create dummy buffer
    const form = new FormData();
    const dummyImage = Buffer.from('fake-image-bytes-jpeg');
    form.append('image', dummyImage, { filename: 'leaf.jpg', contentType: 'image/jpeg' });
    const res = await axios.post(`${PROD_URL}/detect`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });
    results.push({ id: 1, name: 'Crop Disease Detection (/detect)', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 1, name: 'Crop Disease Detection (/detect)', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 02: Crop Recommendation
  try {
    const res = await axios.post(`${PROD_URL}/api/crop/recommend`, {
      nitrogen: 90,
      phosphorus: 42,
      potassium: 43,
      ph: 6.5,
      rainfall: 200,
      humidity: 80,
      temperature: 25,
      language: "en"
    }, { timeout: 10000 });
    results.push({ id: 2, name: 'Crop Recommendation', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 2, name: 'Crop Recommendation', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 03: Fertilizer Recommendation
  try {
    const res = await axios.post(`${PROD_URL}/api/fertilizer/recommend`, {
      crop: "Tomato",
      nitrogen: 100,
      phosphorus: 50,
      potassium: 80,
      language: "en"
    }, { timeout: 10000 });
    results.push({ id: 3, name: 'Fertilizer Recommendation', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 3, name: 'Fertilizer Recommendation', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 04: Soil Health Analysis
  try {
    const res = await axios.post(`${PROD_URL}/api/soil/analyze`, {
      ph: 6.8,
      organic_carbon: 2.1,
      soil_type: "Loamy",
      nitrogen: 120,
      phosphorus: 45,
      potassium: 50
    }, { timeout: 10000 });
    results.push({ id: 4, name: 'Soil Analysis', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 4, name: 'Soil Analysis', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 05: Pest Detection
  try {
    const res = await axios.post(`${PROD_URL}/api/pest/detect`, {
      crop: "Tomato",
      symptoms: ["yellowing leaves", "holes in leaves"]
    }, { timeout: 10000 });
    results.push({ id: 5, name: 'Pest Detection', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 5, name: 'Pest Detection', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 06: Weather Information
  try {
    const res = await axios.get(`${PROD_URL}/api/weather/Pune`, { timeout: 12000 });
    results.push({ id: 6, name: 'Weather Information (/api/weather/Pune)', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 6, name: 'Weather Information (/api/weather/Pune)', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 07: Market Prices
  try {
    const res = await axios.get(`${PROD_URL}/api/market/prices?commodity=wheat&state=Maharashtra`, { timeout: 10000 });
    results.push({ id: 7, name: 'Market Prices', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 7, name: 'Market Prices', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 08: AI Farming Assistant (/api/ai/chat)
  try {
    const res = await axios.post(`${PROD_URL}/api/ai/chat`, {
      message: "How can I improve tomato crop growth?",
      language: "en"
    }, { timeout: 12000 });
    results.push({ id: 8, name: 'AI Farming Assistant (/api/ai/chat)', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 8, name: 'AI Farming Assistant (/api/ai/chat)', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 09: Agriculture Expert Request
  try {
    const res = await axios.post(`${PROD_URL}/api/expert/request`, {
      name: "Ramesh Patil",
      phone: "+919876543210",
      cropType: "Tomato",
      issue: "Leaves are turning yellow with brown spots",
      language: "en"
    }, { timeout: 10000 });
    results.push({ id: 9, name: 'Expert Request', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 9, name: 'Expert Request', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 10: Expert Directory (/api/expert/list)
  try {
    const res = await axios.get(`${PROD_URL}/api/expert/list`, { timeout: 10000 });
    results.push({ id: 10, name: 'Expert Directory (/api/expert/list)', status: 'PASS', code: res.status, data: res.data });
  } catch (err) {
    results.push({ id: 10, name: 'Expert Directory (/api/expert/list)', status: 'FAIL', error: err.response?.data || err.message });
  }

  // API 11: Nearby Agricultural Stores
  try {
    // Test POST /api/stores/nearby
    const resPost = await axios.post(`${PROD_URL}/api/stores/nearby`, {
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 20
    }, { timeout: 10000 });
    results.push({ id: 11, name: 'Nearby Stores (POST)', status: 'PASS', code: resPost.status, data: resPost.data });
  } catch (err) {
    results.push({ id: 11, name: 'Nearby Stores (POST)', status: 'FAIL', error: err.response?.data || err.message });
  }

  // Also test GET /api/stores/nearby?lat=...&lng=... to see if GET is supported on deployed backend
  try {
    const resGet = await axios.get(`${PROD_URL}/api/stores/nearby?lat=12.9716&lng=77.5946`, { timeout: 5000 });
    results.push({ id: 11.1, name: 'Nearby Stores (GET query)', status: 'PASS', code: resGet.status, data: resGet.data });
  } catch (err) {
    results.push({ id: 11.1, name: 'Nearby Stores (GET query)', status: 'FAIL (Route is POST-only on backend)', error: err.response?.status || err.message });
  }

  console.log('\n================ TEST SUMMARY ================');
  results.forEach(r => {
    console.log(`[${r.status}] API ${r.id}: ${r.name}`);
    if (r.status === 'PASS') {
      const summary = typeof r.data === 'object' ? JSON.stringify(r.data).substring(0, 120) : String(r.data);
      console.log(`      Response: ${summary}...`);
    } else {
      console.log(`      Error: ${JSON.stringify(r.error)}`);
    }
  });
}

runTests();

