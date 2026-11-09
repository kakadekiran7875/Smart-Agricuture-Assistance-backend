import axios from 'axios';
import http from 'http';
import FormData from 'form-data';

// Import our server app directly without listening on 5001 if possible, or start server on temporary port 5002
process.env.PORT = '5002';
import('../server.js').then(async () => {
  // Give server 1 second to start on 5002
  await new Promise(r => setTimeout(r, 1500));

  console.log('🚀 Testing Local Backend on Port 5002...\n');
  const base = 'http://localhost:5002';
  const results = [];

  // Test 1: GET /health
  try {
    const r = await axios.get(`${base}/health`);
    results.push({ name: 'GET /health', status: 'PASS', data: r.data.status });
  } catch (e) {
    results.push({ name: 'GET /health', status: 'FAIL', error: e.message });
  }

  // Test 2: GET /api/stores/nearby?lat=12.9716&lng=77.5946 (NEW GET endpoint)
  try {
    const r = await axios.get(`${base}/api/stores/nearby?lat=12.9716&lng=77.5946&radius=15`);
    results.push({ name: 'GET /api/stores/nearby (Query params)', status: 'PASS', count: r.data.count });
  } catch (e) {
    results.push({ name: 'GET /api/stores/nearby (Query params)', status: 'FAIL', error: e.message });
  }

  // Test 3: POST /api/stores/nearby (Body params)
  try {
    const r = await axios.post(`${base}/api/stores/nearby`, { latitude: 12.9716, longitude: 77.5946, radius: 15 });
    results.push({ name: 'POST /api/stores/nearby', status: 'PASS', count: r.data.count });
  } catch (e) {
    results.push({ name: 'POST /api/stores/nearby', status: 'FAIL', error: e.message });
  }

  // Test 4: GET /api/market/prices?crop=wheat&location=Maharashtra
  try {
    const r = await axios.get(`${base}/api/market/prices?crop=wheat&location=Maharashtra`);
    results.push({ name: 'GET /api/market/prices (?crop&location)', status: 'PASS', price: r.data.wheat?.price });
  } catch (e) {
    results.push({ name: 'GET /api/market/prices (?crop&location)', status: 'FAIL', error: e.message });
  }

  // Test 5: POST /api/disease/detect (Alternative alias)
  try {
    const form = new FormData();
    form.append('image', Buffer.from('fake-image-bytes'), { filename: 'leaf.jpg', contentType: 'image/jpeg' });
    const r = await axios.post(`${base}/api/disease/detect`, form, { headers: form.getHeaders() });
    results.push({ name: 'POST /api/disease/detect (Alias)', status: 'PASS', disease: r.data.disease });
  } catch (e) {
    results.push({ name: 'POST /api/disease/detect (Alias)', status: 'FAIL', error: e.message });
  }

  // Test 6: POST /detect
  try {
    const form = new FormData();
    form.append('image', Buffer.from('fake-image-bytes'), { filename: 'leaf.jpg', contentType: 'image/jpeg' });
    const r = await axios.post(`${base}/detect`, form, { headers: form.getHeaders() });
    results.push({ name: 'POST /detect (Standard)', status: 'PASS', disease: r.data.disease });
  } catch (e) {
    results.push({ name: 'POST /detect (Standard)', status: 'FAIL', error: e.message });
  }

  console.table(results);
  process.exit(0);
}).catch(err => {
  console.error('Test startup error:', err);
  process.exit(1);
});

