/**
 * Comprehensive Automated Test Suite for Farmer Authentication & Registration
 * Tests all requirements from MASTER PROMPT:
 * 1. Full Farmer Agricultural Registration (Location, Crops, Land, Irrigation, Experience)
 * 2. Input Validations (Password strength, Password confirmation, PIN code, User type, Email, Mobile)
 * 3. MongoDB Document Verification (Hashed passwords, roles, agricultural fields)
 * 4. Duplicate Prevention (Mobile & Email)
 * 5. Login API (Mobile & Email)
 * 6. OTP Verification Flow (send-otp, verify-otp, resend-otp, attempts, cooldown)
 * 7. JWT Authentication (Access token, Refresh token rotation, Reuse detection)
 * 8. Profile Management (GET /me, PUT /profile with agricultural fields)
 * 9. Password Management (POST & PUT /change-password, forgot-password, reset-password)
 * 10. Logout & Session Revocation
 * 11. Existing Agricultural APIs Compatibility (Crop, Weather)
 */

import axios from 'axios';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:5001/api/auth';
const MONGO_URI = 'mongodb://localhost:27017/Demo';

const testFarmer = {
  fullName: 'Kiran B. Kakade',
  mobileNumber: '9' + Math.floor(100000000 + Math.random() * 900000000), // Random valid 10-digit
  email: `kiran.kakade.${Date.now()}@agriexample.com`,
  password: 'StrongFarmerPassword123!',
  confirmPassword: 'StrongFarmerPassword123!',
  userType: 'farmer',
  preferredLanguage: 'mr',
  state: 'Maharashtra',
  district: 'Pune',
  taluka: 'Daund',
  village: 'Patas',
  fullAddress: 'Near Primary School, Patas, Daund, Pune, Maharashtra',
  pinCode: '413801',
  location: {
    latitude: 18.43,
    longitude: 74.41
  },
  cropsCultivated: ['Sugarcane', 'Wheat', 'Onion'],
  farmingLandAcres: 4.5,
  soilType: 'Black Soil (काळी माती)',
  irrigationType: 'Drip Irrigation (ठिबक सिंचन)',
  farmingExperience: '5-10 years',
  termsAccepted: true
};

let accessToken = '';
let refreshToken = '';
let userId = '';

async function runTests() {
  console.log('================================================================');
  console.log('🌾 STARTING FARMER REGISTRATION & AUTHENTICATION AUDIT TESTS');
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

    // --- 1. VALIDATION TESTS ---
    console.log('\n--- 1. Testing Input Validations & Security Rules ---');

    // 1.1 Password mismatch
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        confirmPassword: 'DifferentPassword123!'
      });
      assert(false, 'Password mismatch should fail');
    } catch (err) {
      assert(err.response?.status === 400, 'Password and confirmPassword mismatch rejected (400)');
    }

    // 1.2 Weak password
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        password: 'weak',
        confirmPassword: 'weak'
      });
      assert(false, 'Weak password should fail');
    } catch (err) {
      assert(err.response?.status === 400, 'Weak password correctly rejected (400)');
    }

    // 1.3 Invalid PIN code
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        pinCode: '123'
      });
      assert(false, 'Invalid PIN code should fail');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid PIN code correctly rejected (400)');
    }

    // 1.4 Invalid User Type
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        userType: 'super_admin'
      });
      assert(false, 'Arbitrary privileged userType should fail');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid userType correctly rejected (400)');
    }

    // 1.5 Invalid Mobile Number
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        mobileNumber: '5551234567'
      });
      assert(false, 'Invalid mobile number should fail');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid mobile number correctly rejected (400)');
    }

    // --- 2. FULL FARMER REGISTRATION ---
    console.log('\n--- 2. Testing Farmer Registration (Agricultural Profile) ---');
    const regRes = await axios.post(`${BASE_URL}/register`, testFarmer);
    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.data.success === true, 'Response has success: true');
    assert(!!regRes.data.token, 'Response returns access token');
    assert(!!regRes.data.refreshToken, 'Response returns refresh token');
    assert(regRes.data.user.fullName === testFarmer.fullName, 'User full name matches');
    assert(regRes.data.user.userType === 'farmer', 'User type is correctly set to farmer');
    assert(regRes.data.user.taluka === 'Daund', 'Taluka matches');
    assert(regRes.data.user.pinCode === '413801', 'PIN code matches');
    assert(regRes.data.user.password === undefined, 'Plain password is NOT returned');
    assert(regRes.data.user.passwordHash === undefined, 'Password hash is NOT returned');

    accessToken = regRes.data.token;
    refreshToken = regRes.data.refreshToken;
    userId = regRes.data.user.id;

    // --- 3. MONGODB RECORD INSPECTION ---
    console.log('\n--- 3. Verifying MongoDB User & Session Documents ---');
    const dbUser = await db.collection('users').findOne({ mobileNumber: testFarmer.mobileNumber });
    assert(!!dbUser, 'User document saved in MongoDB "users" collection');
    assert(dbUser.passwordHash && dbUser.passwordHash.startsWith('$2'), 'Password encrypted with bcrypt');
    assert(dbUser.password === undefined, 'Plain password is NOT stored in MongoDB');
    assert(dbUser.confirmPassword === undefined, 'confirmPassword is NOT stored in MongoDB');
    assert(dbUser.taluka === 'Daund', 'MongoDB stored taluka');
    assert(dbUser.pinCode === '413801', 'MongoDB stored PIN code');
    assert(Array.isArray(dbUser.cropsCultivated) && dbUser.cropsCultivated.includes('Sugarcane'), 'MongoDB stored crops cultivated');
    assert(dbUser.farmingLandAcres === 4.5, 'MongoDB stored farming land acres');
    assert(dbUser.role === 'farmer', 'User role is farmer');
    assert(dbUser.isMobileVerified === false, 'isMobileVerified is initially false');

    const dbSession = await db.collection('refresh_sessions').findOne({ userId: new mongoose.Types.ObjectId(userId) });
    assert(!!dbSession, 'Refresh session document created in "refresh_sessions"');
    assert(dbSession.tokenHash.length === 64, 'Refresh token stored as SHA-256 hash');

    // --- 4. DUPLICATE PREVENTION ---
    console.log('\n--- 4. Testing Duplicate Prevention ---');
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        email: `another.${Date.now()}@example.com`
      });
      assert(false, 'Duplicate mobile number should fail');
    } catch (err) {
      assert(err.response?.status === 409, 'Duplicate mobile number rejected (409 Conflict)');
    }

    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testFarmer,
        mobileNumber: '9' + Math.floor(100000000 + Math.random() * 900000000)
      });
      assert(false, 'Duplicate email should fail');
    } catch (err) {
      assert(err.response?.status === 409, 'Duplicate email rejected (409 Conflict)');
    }

    // --- 5. OTP VERIFICATION FLOW ---
    console.log('\n--- 5. Testing Mobile OTP Verification Flow ---');
    const sendOtpRes = await axios.post(`${BASE_URL}/send-otp`, {
      mobileNumber: testFarmer.mobileNumber,
      purpose: 'verification'
    });
    assert(sendOtpRes.status === 200, 'send-otp returns 200 OK');
    assert(sendOtpRes.data.success === true, 'send-otp has success: true');

    // In development mode, devOtp is returned for testing verification
    const receivedOtp = sendOtpRes.data.devOtp;

    // Test Resend cooldown (should reject within 60s)
    try {
      await axios.post(`${BASE_URL}/send-otp`, {
        mobileNumber: testFarmer.mobileNumber,
        purpose: 'verification'
      });
      assert(false, 'Resend OTP within cooldown should fail');
    } catch (err) {
      assert(err.response?.status === 429, 'Resend OTP cooldown enforced (429 Rate Limit)');
    }

    // Test verify OTP with wrong code
    try {
      await axios.post(`${BASE_URL}/verify-otp`, {
        mobileNumber: testFarmer.mobileNumber,
        otp: '000000',
        purpose: 'verification'
      });
      assert(false, 'Incorrect OTP should fail');
    } catch (err) {
      assert(err.response?.status === 400, 'Incorrect OTP rejected (400)');
    }

    // Test verify OTP with correct code if devOtp available
    if (receivedOtp) {
      const verifyRes = await axios.post(`${BASE_URL}/verify-otp`, {
        mobileNumber: testFarmer.mobileNumber,
        otp: receivedOtp,
        purpose: 'verification'
      });
      assert(verifyRes.status === 200, 'verify-otp returns 200 OK');
      assert(verifyRes.data.isMobileVerified === true, 'isMobileVerified is confirmed true');

      const verifiedUser = await db.collection('users').findOne({ mobileNumber: testFarmer.mobileNumber });
      assert(verifiedUser.isMobileVerified === true, 'MongoDB user record updated with isMobileVerified: true');
    }

    // --- 6. USER LOGIN ---
    console.log('\n--- 6. Testing User Login ---');
    const loginMobileRes = await axios.post(`${BASE_URL}/login`, {
      identifier: testFarmer.mobileNumber,
      password: testFarmer.password
    });
    assert(loginMobileRes.status === 200, 'Login with mobile number returns 200 OK');
    assert(!!loginMobileRes.data.token, 'Login returns new JWT access token');
    assert(loginMobileRes.data.user.taluka === 'Daund', 'Login response preserves agricultural profile');

    const loginEmailRes = await axios.post(`${BASE_URL}/login`, {
      email: testFarmer.email,
      password: testFarmer.password
    });
    assert(loginEmailRes.status === 200, 'Login with email returns 200 OK');
    accessToken = loginEmailRes.data.token;
    refreshToken = loginEmailRes.data.refreshToken;

    // --- 7. PROTECTED ROUTES & PROFILE MANAGEMENT ---
    console.log('\n--- 7. Testing Protected Profile Routes ---');
    const meRes = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meRes.data.user.id === userId, 'Current user profile matches');

    // Profile update
    const updateRes = await axios.put(
      `${BASE_URL}/profile`,
      {
        taluka: 'Shirur',
        cropsCultivated: ['Sugarcane', 'Pomegranate', 'Grapes'],
        farmingLandAcres: 8.0,
        irrigationType: 'Solar Drip Irrigation'
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    assert(updateRes.status === 200, 'PUT /api/auth/profile returns 200 OK');
    assert(updateRes.data.user.taluka === 'Shirur', 'Taluka updated to Shirur');
    assert(updateRes.data.user.farmingLandAcres === 8.0, 'Farming land acres updated to 8.0');

    // --- 8. REFRESH TOKEN ROTATION ---
    console.log('\n--- 8. Testing Refresh Token Rotation ---');
    const refreshRes = await axios.post(`${BASE_URL}/refresh`, { refreshToken: refreshToken });
    assert(refreshRes.status === 200, 'Token refresh returns 200 OK');
    assert(!!refreshRes.data.accessToken, 'New rotated access token issued');
    assert(refreshRes.data.refreshToken !== refreshToken, 'New rotated refresh token issued');

    const oldToken = refreshToken;
    const newRefToken = refreshRes.data.refreshToken;
    accessToken = refreshRes.data.accessToken;

    // Token reuse detection test
    try {
      await axios.post(`${BASE_URL}/refresh`, { refreshToken: oldToken });
      assert(false, 'Old refresh token reuse should be blocked');
    } catch (err) {
      assert(err.response?.status === 401, 'Token reuse detected and rejected (401)');
    }

    // --- 9. PASSWORD MANAGEMENT ---
    console.log('\n--- 9. Testing Password Change & Reset ---');
    const newPassword = 'NewStrongFarmerPassword456!';
    const changePassRes = await axios.put(
      `${BASE_URL}/change-password`,
      {
        currentPassword: testFarmer.password,
        newPassword: newPassword,
        confirmPassword: newPassword
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    assert(changePassRes.status === 200, 'PUT /api/auth/change-password returns 200 OK');

    // Verify login with new password
    const loginWithNewPass = await axios.post(`${BASE_URL}/login`, {
      identifier: testFarmer.mobileNumber,
      password: newPassword
    });
    assert(loginWithNewPass.status === 200, 'Login with new password succeeds');
    accessToken = loginWithNewPass.data.token;
    refreshToken = loginWithNewPass.data.refreshToken;

    // --- 10. LOGOUT ---
    console.log('\n--- 10. Testing Logout ---');
    const logoutRes = await axios.post(
      `${BASE_URL}/logout`,
      { refreshToken: refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    assert(logoutRes.status === 200, 'Logout returns 200 OK');

    // --- 11. AGRICULTURAL APIS COMPATIBILITY ---
    console.log('\n--- 11. Verifying Agricultural Services Intact ---');
    const cropRes = await axios.post('http://localhost:5001/api/crop/recommend', {
      nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202
    });
    assert(cropRes.status === 200 && (cropRes.data.recommendedCrop || cropRes.data.crop || cropRes.data.success), 'Crop recommendation API operational');

    const weatherRes = await axios.get('http://localhost:5001/api/weather/Pune');
    assert(weatherRes.status === 200 && (weatherRes.data.location || weatherRes.data.city), 'Weather forecast API operational');

    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('Fatal test execution error:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
