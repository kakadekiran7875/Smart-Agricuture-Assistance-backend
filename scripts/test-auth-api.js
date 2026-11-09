import axios from 'axios';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';

async function runAuthTests() {
  console.log('====================================================');
  console.log(`🔐 Testing Authentication API at ${BASE_URL}`);
  console.log('====================================================\n');

  const testPhone = '987654' + Math.floor(1000 + Math.random() * 9000);
  const testPassword = 'password123';
  const testName = 'Ramesh Patil';
  let authToken = null;
  const results = [];

  // Test 1: Register new user
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: testName,
      phone: testPhone,
      state: 'Maharashtra',
      password: testPassword
    });

    authToken = res.data.token;
    const passed = res.status === 201 && res.data.success === true && !!res.data.token && res.data.user.phone === testPhone;
    results.push({
      test: '1. Register New Farmer (POST /api/auth/register)',
      status: passed ? 'PASS' : 'FAIL',
      response: {
        success: res.data.success,
        message: res.data.message,
        user: res.data.user,
        tokenReceived: !!res.data.token
      }
    });
  } catch (err) {
    results.push({
      test: '1. Register New Farmer (POST /api/auth/register)',
      status: 'FAIL',
      error: err.response?.data || err.message
    });
  }

  // Test 2: Register duplicate user (Same phone)
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Duplicate Ramesh',
      phone: testPhone,
      state: 'Maharashtra',
      password: 'newpassword'
    });
    results.push({
      test: '2. Prevent Duplicate Registration (Unique phone check)',
      status: 'FAIL',
      error: 'Expected 400 duplicate error, but request succeeded'
    });
  } catch (err) {
    const passed = (err.response?.status === 400 || err.response?.status === 409) && err.response?.data?.message?.includes('already exists');
    results.push({
      test: '2. Prevent Duplicate Registration (Unique phone check)',
      status: passed ? 'PASS' : 'FAIL',
      code: err.response?.status,
      message: err.response?.data?.message
    });
  }

  // Test 3: Login with correct credentials
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: testPhone,
      password: testPassword
    });

    const passed = res.status === 200 && res.data.success === true && !!res.data.token && res.data.user.phone === testPhone;
    results.push({
      test: '3. Login with Identifier & Password (POST /api/auth/login)',
      status: passed ? 'PASS' : 'FAIL',
      response: {
        success: res.data.success,
        message: res.data.message,
        user: res.data.user,
        tokenReceived: !!res.data.token
      }
    });
  } catch (err) {
    results.push({
      test: '3. Login with Identifier & Password (POST /api/auth/login)',
      status: 'FAIL',
      error: err.response?.data || err.message
    });
  }

  // Test 4: Login with incorrect password
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: testPhone,
      password: 'wrong_password_xyz'
    });
    results.push({
      test: '4. Reject Invalid Password (POST /api/auth/login)',
      status: 'FAIL',
      error: 'Expected 401 error, but login succeeded'
    });
  } catch (err) {
    const passed = err.response?.status === 401;
    results.push({
      test: '4. Reject Invalid Password (POST /api/auth/login)',
      status: passed ? 'PASS' : 'FAIL',
      code: err.response?.status,
      message: err.response?.data?.message
    });
  }

  // Test 5: Protected Route GET /api/auth/profile with Bearer Token
  try {
    const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    const passed = res.status === 200 && res.data.success === true && res.data.user.phone === testPhone;
    results.push({
      test: '5. Access Protected Profile (GET /api/auth/profile)',
      status: passed ? 'PASS' : 'FAIL',
      user: res.data.user
    });
  } catch (err) {
    results.push({
      test: '5. Access Protected Profile (GET /api/auth/profile)',
      status: 'FAIL',
      error: err.response?.data || err.message
    });
  }

  // Test 6: Protected Route GET /api/auth/profile without Token
  try {
    await axios.get(`${BASE_URL}/api/auth/profile`);
    results.push({
      test: '6. Reject Request Without Token (GET /api/auth/profile)',
      status: 'FAIL',
      error: 'Expected 401 error, but request succeeded'
    });
  } catch (err) {
    const passed = err.response?.status === 401;
    results.push({
      test: '6. Reject Request Without Token (GET /api/auth/profile)',
      status: passed ? 'PASS' : 'FAIL',
      code: err.response?.status,
      message: err.response?.data?.message
    });
  }

  console.log('\n================ TEST SUMMARY ================');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.test}`);
    if (r.response) console.log('   Response:', JSON.stringify(r.response));
    if (r.user) console.log('   User Profile:', JSON.stringify(r.user));
    if (r.error) console.log('   Error:', JSON.stringify(r.error));
    if (r.message && !r.response) console.log(`   Message (${r.code}): ${r.message}`);
  });
  console.log('==============================================\n');

  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length > 0) {
    process.exit(1);
  }
}

runAuthTests();

