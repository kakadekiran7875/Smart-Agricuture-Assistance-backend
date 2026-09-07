// Test script for disease detection API
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';

async function runTests() {
  console.log('🧪 Testing Disease Detection API at:', BASE_URL);
  let passed = 0;
  let failed = 0;

  // Test 1: GET /detect/list
  try {
    console.log('\n1. Testing GET /detect/list...');
    const res = await axios.get(`${BASE_URL}/detect/list`);
    if (res.status === 200 && res.data.success && Array.isArray(res.data.diseases)) {
      console.log(`✅ List diseases passed! Found ${res.data.count} diseases.`);
      passed++;
    } else {
      console.error('❌ List diseases failed: unexpected structure', res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ List diseases error:', err.message);
    failed++;
  }

  // Test 2: GET /detect/info/:diseaseName
  try {
    console.log('\n2. Testing GET /detect/info/Tomato Early Blight...');
    const res = await axios.get(`${BASE_URL}/detect/info/Tomato%20Early%20Blight`);
    if (res.status === 200 && res.data.success && res.data.treatment) {
      console.log(`✅ Disease info passed! Disease: ${res.data.disease}`);
      passed++;
    } else {
      console.error('❌ Disease info failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Disease info error:', err.message);
    failed++;
  }

  // Test 3: POST /detect without image (should return 400)
  try {
    console.log('\n3. Testing POST /detect without image (expecting 400)...');
    await axios.post(`${BASE_URL}/detect`);
    console.error('❌ Expected 400 error but request succeeded');
    failed++;
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('✅ Validation correctly rejected missing image with 400!');
      passed++;
    } else {
      console.error('❌ Unexpected error status:', err.message);
      failed++;
    }
  }

  // Test 4: POST /detect with sample image buffer
  try {
    console.log('\n4. Testing POST /detect with sample image upload...');
    const form = new FormData();
    // 1x1 transparent PNG image buffer for testing
    const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    form.append('image', samplePng, { filename: 'test-leaf.png', contentType: 'image/png' });
    form.append('language', 'en');

    const res = await axios.post(`${BASE_URL}/detect`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });

    if (res.status === 200 && res.data.success && res.data.disease) {
      console.log(`✅ Image detection passed! Detected: ${res.data.disease} (${res.data.analysis_method})`);
      passed++;
    } else {
      console.error('❌ Detection response invalid:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('❌ Image detection error:', err.message);
    failed++;
  }

  console.log('\n========================================');
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
