/**
 * Comprehensive Automated Test Suite for Reverse Geocoding & Location Persistence
 * Tests all requirements from MASTER PROMPT:
 * 1. Valid urban coordinates (Pune)
 * 2. Valid rural coordinates (Daund / Patas)
 * 3. Different district coordinates (Nashik)
 * 4. Coordinate validation (out of bounds, non-numeric, missing)
 * 5. In-memory caching for repeated coordinates
 * 6. Farmer Registration using detected location data
 * 7. MongoDB verification of stored location fields
 * 8. Existing Agricultural APIs compatibility
 */

import axios from 'axios';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:5001/api/location';
const AUTH_URL = 'http://localhost:5001/api/auth';
const MONGO_URI = 'mongodb://localhost:27017/Demo';

async function runTests() {
  console.log('================================================================');
  console.log('📍 STARTING REVERSE GEOCODING & LOCATION STORAGE AUDIT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // --- 1. REVERSE GEOCODING: URBAN COORDINATES (Pune) ---
    console.log('\n--- 1. Testing Urban Coordinates Reverse Geocoding ---');
    const puneRes = await axios.post(`${BASE_URL}/reverse-geocode`, {
      latitude: 18.5204,
      longitude: 73.8567
    });

    assert(puneRes.status === 200, 'POST /reverse-geocode returns 200 OK');
    assert(puneRes.data.success === true, 'Response contains success: true');
    assert(puneRes.data.location.state === 'Maharashtra', 'Detected state is Maharashtra');
    assert(puneRes.data.location.district === 'Pune', 'Detected district is Pune');
    assert(puneRes.data.location.country === 'India', 'Detected country is India');
    assert(puneRes.data.location.latitude === 18.5204, 'Preserves exact latitude');
    assert(puneRes.data.location.longitude === 73.8567, 'Preserves exact longitude');
    assert(!!puneRes.data.location.fullAddress, 'Returns human-readable full address');

    // --- 2. REVERSE GEOCODING: RURAL COORDINATES (Daund / Patas) ---
    console.log('\n--- 2. Testing Rural Agricultural Coordinates ---');
    const ruralRes = await axios.post(`${BASE_URL}/reverse-geocode`, {
      latitude: 18.4357,
      longitude: 74.4206
    });

    assert(ruralRes.status === 200, 'Rural reverse-geocode returns 200 OK');
    assert(ruralRes.data.location.state === 'Maharashtra', 'Rural state is Maharashtra');
    assert(ruralRes.data.location.district === 'Pune', 'Rural district is Pune');
    assert(ruralRes.data.location.taluka === 'Daund', 'Identified subdistrict/taluka as Daund');
    assert(ruralRes.data.location.pinCode === '412215', 'Extracted PIN code 412215');

    // --- 3. REVERSE GEOCODING: DIFFERENT DISTRICT (Nashik) ---
    console.log('\n--- 3. Testing Coordinates in Another District (Nashik) ---');
    const nashikRes = await axios.post(`${BASE_URL}/reverse-geocode`, {
      latitude: 19.9975,
      longitude: 73.7898
    });

    assert(nashikRes.status === 200, 'Nashik reverse-geocode returns 200 OK');
    assert(nashikRes.data.location.district === 'Nashik', 'Identified district as Nashik');
    assert(nashikRes.data.location.state === 'Maharashtra', 'State is Maharashtra');

    // --- 4. COORDINATE VALIDATION & ERROR HANDLING ---
    console.log('\n--- 4. Testing Input Validations & Error Handling ---');

    // 4.1 Latitude > 90
    try {
      await axios.post(`${BASE_URL}/reverse-geocode`, { latitude: 95.0, longitude: 74.0 });
      assert(false, 'Latitude > 90 should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Latitude > 90 rejected with 400 Bad Request');
    }

    // 4.2 Latitude < -90
    try {
      await axios.post(`${BASE_URL}/reverse-geocode`, { latitude: -95.0, longitude: 74.0 });
      assert(false, 'Latitude < -90 should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Latitude < -90 rejected with 400 Bad Request');
    }

    // 4.3 Longitude > 180
    try {
      await axios.post(`${BASE_URL}/reverse-geocode`, { latitude: 18.0, longitude: 195.0 });
      assert(false, 'Longitude > 180 should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Longitude > 180 rejected with 400 Bad Request');
    }

    // 4.4 Non-numeric coordinates
    try {
      await axios.post(`${BASE_URL}/reverse-geocode`, { latitude: 'invalid_lat', longitude: 74.0 });
      assert(false, 'Non-numeric latitude should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Non-numeric coordinate rejected with 400 Bad Request');
    }

    // 4.5 Missing coordinates
    try {
      await axios.post(`${BASE_URL}/reverse-geocode`, {});
      assert(false, 'Empty coordinates payload should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Missing coordinates rejected with 400 Bad Request');
    }

    // --- 5. IN-MEMORY CACHE VERIFICATION ---
    console.log('\n--- 5. Testing In-Memory Cache (Nominatim Rate Protection) ---');
    const cachedRes = await axios.post(`${BASE_URL}/reverse-geocode`, {
      latitude: 18.5204,
      longitude: 73.8567
    });
    assert(cachedRes.status === 200, 'Repeated coordinates request returns 200 OK');
    assert(cachedRes.data.location.cached === true, 'Response served directly from in-memory cache');

    // --- 6. REGISTRATION WITH CONFIRMED LOCATION ---
    console.log('\n--- 6. Testing Farmer Registration with Detected Location ---');
    const detectedLocation = ruralRes.data.location;

    const registeredFarmer = {
      fullName: 'Sopanrao Jadhav',
      mobileNumber: '9' + Math.floor(100000000 + Math.random() * 900000000),
      email: `sopanrao.${Date.now()}@agriexample.com`,
      password: 'StrongFarmerPassword123!',
      confirmPassword: 'StrongFarmerPassword123!',
      userType: 'farmer',
      preferredLanguage: 'mr',
      state: detectedLocation.state,
      district: detectedLocation.district,
      taluka: detectedLocation.taluka || 'Daund',
      village: 'Patas Village',
      fullAddress: detectedLocation.fullAddress,
      pinCode: detectedLocation.pinCode || '412215',
      location: {
        latitude: detectedLocation.latitude,
        longitude: detectedLocation.longitude
      },
      cropsCultivated: ['Sugarcane', 'Jowar'],
      farmingLandAcres: 6.5,
      termsAccepted: true
    };

    const regRes = await axios.post(`${AUTH_URL}/register`, registeredFarmer);
    assert(regRes.status === 201, 'Farmer registered with detected location (201 Created)');
    assert(regRes.data.user.taluka === 'Daund', 'Registration stored detected taluka');
    assert(regRes.data.user.pinCode === '412215', 'Registration stored detected PIN code');

    // --- 7. MONGODB PERSISTENCE VERIFICATION ---
    console.log('\n--- 7. Verifying MongoDB Location Persistence ---');
    const dbUser = await db.collection('users').findOne({ mobileNumber: registeredFarmer.mobileNumber });
    assert(!!dbUser, 'User document found in MongoDB "users" collection');
    assert(dbUser.state === 'Maharashtra', 'MongoDB verified state: Maharashtra');
    assert(dbUser.district === 'Pune', 'MongoDB verified district: Pune');
    assert(dbUser.taluka === 'Daund', 'MongoDB verified taluka: Daund');
    assert(dbUser.pinCode === '412215', 'MongoDB verified pinCode: 412215');
    assert(dbUser.location.latitude === detectedLocation.latitude, 'MongoDB verified latitude');
    assert(dbUser.location.longitude === detectedLocation.longitude, 'MongoDB verified longitude');
    assert(dbUser.country === 'India', 'MongoDB verified country: India');

    // --- 8. PRESERVATION OF AGRICULTURAL APIS ---
    console.log('\n--- 8. Verifying Agricultural Services Remain Intact ---');
    const cropRes = await axios.post('http://localhost:5001/api/crop/recommend', {
      nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202
    });
    assert(cropRes.status === 200 && (cropRes.data.recommendedCrop || cropRes.data.crop), 'Crop Recommendation API active');

    const weatherRes = await axios.get('http://localhost:5001/api/weather/Pune');
    assert(weatherRes.status === 200 && weatherRes.data.location, 'Weather API active');

    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('Fatal test error:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();

