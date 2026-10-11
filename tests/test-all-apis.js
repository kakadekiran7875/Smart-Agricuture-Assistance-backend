import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';

const results = [];

async function test(name, fn) {
  try {
    const res = await fn();
    console.log(`✅ [PASS] ${name}`);
    results.push({ name, passed: true, details: res });
  } catch (err) {
    console.error(`❌ [FAIL] ${name}: ${err.response?.data?.message || err.message}`);
    results.push({ name, passed: false, error: err.response?.data || err.message });
  }
}

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log(`🚀 Starting Full Backend API Test Suite at ${BASE_URL}`);
  console.log('====================================================\n');

  // 1. Health
  await test('Server Health Check (GET /health)', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.status !== 200 || res.data.status !== 'ok') throw new Error('Health check status is not ok');
    return `Server uptime: ${res.data.uptime?.toFixed(1)}s, DB: ${res.data.database}`;
  });

  // 2. Weather
  await test('Weather API (GET /api/weather/Pune)', async () => {
    const res = await axios.get(`${BASE_URL}/api/weather/Pune`);
    if (res.status !== 200 || !res.data.temperature) throw new Error('Weather data missing temperature');
    return `Pune Temp: ${res.data.temperature}°C, Condition: ${res.data.condition}`;
  });

  // 3. Crop Recommendation (English & Marathi)
  await test('Crop Recommendation in Marathi (POST /api/crop/recommend)', async () => {
    const res = await axios.post(`${BASE_URL}/api/crop/recommend`, {
      nitrogen: 350,
      phosphorus: 25,
      potassium: 40,
      ph: 6.5,
      language: 'mr'
    });
    if (res.status !== 200 || !res.data.recommendedCrop) throw new Error('Crop recommendation missing');
    return `Recommended: ${res.data.recommendedCrop} (Original: ${res.data.recommendedCropOriginal})`;
  });

  // 4. Soil Analysis
  await test('Soil Analysis (POST /api/soil/analyze)', async () => {
    const res = await axios.post(`${BASE_URL}/api/soil/analyze`, {
      ph: 6.8,
      organicCarbon: 0.75,
      nitrogen: 280,
      phosphorus: 35,
      potassium: 150,
      soil_type: 'Clay',
      language: 'mr'
    });
    if (res.status !== 200 || !res.data.soilQuality) throw new Error('Soil quality missing');
    return `Quality: ${res.data.soilQuality}, pH Status: ${res.data.details?.phAnalysis?.classification}`;
  });

  // 5. Fertilizer Recommendation
  await test('Fertilizer Recommendation (POST /api/fertilizer/recommend)', async () => {
    const res = await axios.post(`${BASE_URL}/api/fertilizer/recommend`, {
      crop: 'Wheat',
      nitrogen: 220,
      phosphorus: 20,
      potassium: 35,
      language: 'mr'
    });
    if (res.status !== 200 || !res.data.recommendedFertilizer) throw new Error('Fertilizer recommendation missing');
    return `Fertilizer: ${res.data.recommendedFertilizer}, Dosage: ${res.data.dosage}`;
  });

  // 6. Pest Detection
  await test('Pest Detection (POST /api/pest/detect)', async () => {
    const res = await axios.post(`${BASE_URL}/api/pest/detect`, {
      crop: 'Tomato',
      symptoms: 'leaf holes',
      language: 'mr'
    });
    if (res.status !== 200) throw new Error('Pest detection failed');
    return `Pest advice: ${res.data.pest || res.data.message}`;
  });

  // 7. Disease Detection - List
  await test('Disease Detection List (GET /detect/list)', async () => {
    const res = await axios.get(`${BASE_URL}/detect/list`);
    if (res.status !== 200 || !Array.isArray(res.data.diseases)) throw new Error('Invalid diseases list');
    return `Diseases count: ${res.data.count}`;
  });

  // 8. Disease Detection - Image Upload
  await test('Disease Detection via Image (POST /detect)', async () => {
    const form = new FormData();
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    form.append('image', samplePng, { filename: 'crop-leaf.png', contentType: 'image/png' });
    form.append('language', 'mr');
    const res = await axios.post(`${BASE_URL}/detect`, form, { headers: form.getHeaders() });
    if (res.status !== 200 || !res.data.disease) throw new Error('Disease not returned');
    return `Detected Disease: ${res.data.disease} (${res.data.analysis_method})`;
  });

  // 9. Market Prices
  await test('Market Prices (GET /api/market/prices)', async () => {
    const res = await axios.get(`${BASE_URL}/api/market/prices?commodity=Tomato`);
    if (res.status !== 200 || !Array.isArray(res.data.prices)) throw new Error('Market prices not returned');
    return `Prices list count: ${res.data.prices.length}`;
  });

  // 10. Experts List
  await test('Expert List (GET /api/expert/list)', async () => {
    const res = await axios.get(`${BASE_URL}/api/expert/list`);
    if (res.status !== 200 || !res.data.success) throw new Error('Experts list failed');
    return `Found ${res.data.count} experts in DB`;
  });

  // 11. Stores Categories
  await test('Store Categories (GET /api/stores/categories/list)', async () => {
    const res = await axios.get(`${BASE_URL}/api/stores/categories/list`);
    if (res.status !== 200 || !res.data.success) throw new Error('Store categories failed');
    return `Found ${res.data.categories?.length} categories`;
  });

  // 12. Stores Nearby
  await test('Nearby Stores Search (POST /api/stores/nearby)', async () => {
    const res = await axios.post(`${BASE_URL}/api/stores/nearby`, {
      latitude: 12.9750,
      longitude: 77.5980,
      radius: 10
    });
    if (res.status !== 200) throw new Error('Nearby stores failed');
    return `Stores found: ${res.data.count || res.data.stores?.length || 0}`;
  });

  // 13. System Config
  await test('System Configuration (GET /api/system/config)', async () => {
    const res = await axios.get(`${BASE_URL}/api/system/config`);
    if (res.status !== 200 || !res.data.success) throw new Error('System config failed');
    return `Backend IP: ${res.data.config?.backend_ip}, Port: ${res.data.config?.port}`;
  });

  // 14. Chatbot Tips
  await test('Chatbot Tips (GET /api/chatbot/tips)', async () => {
    const res = await axios.get(`${BASE_URL}/api/chatbot/tips?language=mr`);
    if (res.status !== 200 || !res.data.tips) throw new Error('Chatbot tips failed');
    return `Tips count: ${res.data.tips.length}`;
  });

  console.log('\n====================================================');
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`📊 Test Summary: ${passedCount} / ${total} Passed (${failedCount} Failed)`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runComprehensiveTests();
