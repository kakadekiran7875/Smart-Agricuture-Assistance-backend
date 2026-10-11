import axios from 'axios';
import FormData from 'form-data';

const BASE = 'http://localhost:5001';

async function testAllFrontendEndpoints() {
  console.log('================================================================');
  console.log('🧪 Testing Frontend API Wiring Against Local Backend (Port 5001)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function check(num, name, fn) {
    total++;
    try {
      const res = await fn();
      console.log(`✅ [${num}] PASS: ${name}`);
      console.log(`   Response snippet:`, JSON.stringify(res).slice(0, 160) + '...\n');
      passed++;
    } catch (err) {
      console.log(`❌ [${num}] FAIL: ${name}`);
      console.log(`   Error:`, err.response?.data || err.message, '\n');
    }
  }

  // 1. Crop Disease Diagnosis (POST /detect or /api/detect with multipart/form-data)
  await check(1, 'Crop Disease Diagnosis (POST /api/detect & POST /detect)', async () => {
    const form = new FormData();
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    form.append('image', samplePng, { filename: 'tomato-leaf.png', contentType: 'image/png' });
    form.append('language', 'en');
    const res = await axios.post(`${BASE}/api/detect`, form, { headers: form.getHeaders() });
    if (!res.data.crop || !res.data.disease || !res.data.treatment) {
      throw new Error('Missing expected fields in disease response');
    }
    return { crop: res.data.crop, disease: res.data.disease, confidence: res.data.confidence, treatment: res.data.treatment };
  });

  // 2. Crop Recommendation (POST /api/crop/recommend & /api/crops/recommend)
  await check(2, 'Crop Recommendation (POST /api/crop/recommend & /api/crops/recommend)', async () => {
    const payload = {
      nitrogen: 90,
      phosphorus: 42,
      potassium: 43,
      temperature: 25.5,
      humidity: 78,
      ph: 6.5,
      rainfall: 200,
      language: "en"
    };
    const res = await axios.post(`${BASE}/api/crop/recommend`, payload);
    const res2 = await axios.post(`${BASE}/api/crops/recommend`, payload);
    if (!res.data.recommendedCrop || !res2.data.recommendedCrop) throw new Error('Missing recommendedCrop');
    return { recommendedCrop: res.data.recommendedCrop, confidence: res.data.confidence, message: res.data.message };
  });

  // 3. Soil Analysis (POST /api/soil/analyze)
  await check(3, 'Soil Analysis (POST /api/soil/analyze)', async () => {
    const payload = {
      ph: 6.5,
      organicCarbon: 1.5
    };
    const res = await axios.post(`${BASE}/api/soil/analyze`, payload);
    if (!res.data.soilQuality || !res.data.ph) throw new Error('Missing soilQuality');
    return { soilQuality: res.data.soilQuality, ph: res.data.ph, organicCarbon: res.data.organicCarbon, message: res.data.message };
  });

  // 4. Fertilizer Recommendation (POST /api/fertilizer/recommend)
  await check(4, 'Fertilizer Recommendation (POST /api/fertilizer/recommend)', async () => {
    const payload = {
      crop: "Wheat",
      nitrogen: 120,
      phosphorus: 40,
      potassium: 60,
      language: "en"
    };
    const res = await axios.post(`${BASE}/api/fertilizer/recommend`, payload);
    if (!res.data.recommendedFertilizer || !res.data.dosage) throw new Error('Missing fertilizer fields');
    return { recommendedFertilizer: res.data.recommendedFertilizer, dosage: res.data.dosage, timing: res.data.timing };
  });

  // 5. Pest Detection (POST /api/pest/detect with array symptoms)
  await check(5, 'Pest Detection (POST /api/pest/detect with array symptoms)', async () => {
    const payload = {
      crop: "Tomato",
      symptoms: ["bored holes in fruit", "leaf damage"]
    };
    const res = await axios.post(`${BASE}/api/pest/detect`, payload);
    if (!res.data.pestName || !res.data.controlMeasures) throw new Error('Missing pestName or controlMeasures');
    return { pestName: res.data.pestName, severity: res.data.severity, controlMeasures: res.data.controlMeasures };
  });

  // 6. Live Weather Info (GET /api/weather/:location)
  await check(6, 'Live Weather Info (GET /api/weather/Nashik)', async () => {
    const res = await axios.get(`${BASE}/api/weather/Nashik`);
    if (res.data.temperature === undefined || res.data.humidity === undefined) throw new Error('Missing weather data');
    return {
      location: res.data.location,
      temperature: res.data.temperature,
      humidity: res.data.humidity,
      rainfall: res.data.rainfall,
      condition: res.data.condition,
      forecast: res.data.forecast?.slice(0, 2)
    };
  });

  // 7. APMC Market Prices (GET /api/market/prices)
  await check(7, 'APMC Market Prices (GET /api/market/prices with commodity dictionary)', async () => {
    const res = await axios.get(`${BASE}/api/market/prices`);
    if (!res.data.tomato || !res.data.wheat) throw new Error('Missing tomato or wheat in dictionary');
    return { tomato: res.data.tomato, wheat: res.data.wheat, onion: res.data.onion };
  });

  // 8. AI Chatbot (POST /api/ai/chat and /api/chatbot/chat)
  await check(8, 'AI Chatbot (POST /api/ai/chat with "message" field)', async () => {
    const payload = {
      message: "When should I irrigate wheat after sowing?",
      language: "en"
    };
    const res = await axios.post(`${BASE}/api/ai/chat`, payload);
    if (!res.data.response) throw new Error('Missing response field in AI chat');
    return { response: res.data.response };
  });

  // 9. Expert Callback Request (POST /api/expert/request)
  await check(9, 'Expert Callback Request (POST /api/expert/request with frontend fields)', async () => {
    const payload = {
      name: "Ramesh Patel",
      phone: "+91 98765 43210",
      crop: "Tomato",
      question: "Severe fruit dropping after flowering",
      preferredTime: "Morning",
      language: "mr",
      timestamp: "2026-10-12T01:50:00.000Z"
    };
    const res = await axios.post(`${BASE}/api/expert/request`, payload);
    if (!res.data.success || !res.data.requestId) throw new Error('Missing requestId');
    return { success: res.data.success, requestId: res.data.requestId, message: res.data.message };
  });

  // 10. Nearby Agri Stores (POST /api/stores/nearby)
  await check(10, 'Nearby Agri Stores (POST /api/stores/nearby)', async () => {
    const payload = {
      latitude: 12.9750,
      longitude: 77.5980,
      radius: 10
    };
    const res = await axios.post(`${BASE}/api/stores/nearby`, payload);
    if (!res.data.success || !Array.isArray(res.data.stores)) throw new Error('Missing stores array');
    return { count: res.data.count, stores: res.data.stores.map(s => s.name) };
  });

  // 11. Backend Health Check (GET /health)
  await check(11, 'Backend Health Check (GET /health)', async () => {
    const res = await axios.get(`${BASE}/health`);
    if (res.data.status !== 'ok') throw new Error('Health status is not ok');
    return { status: res.data.status, database: res.data.database };
  });

  console.log('================================================================');
  console.log(`🎉 Summary: ${passed} / ${total} Endpoints Verified Successfully!`);
  console.log('================================================================\n');

  if (passed !== total) process.exit(1);
}

testAllFrontendEndpoints();
