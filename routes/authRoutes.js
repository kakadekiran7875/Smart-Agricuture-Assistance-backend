/**
 * Authentication Routes
 * Smart Agriculture Assistant Backend
 * Base URL: /api/auth
 */

import express from 'express';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  resendOtp,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  seedDemoUser
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. User Registration
router.post('/register', register);

// 2. User Login
router.post('/login', login);

// 3. Mobile OTP Verification
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// 4. Refresh Access Token (Token rotation)
router.post('/refresh', refresh);

// 5. User Logout (Revoke session & clear cookies)
router.post('/logout', logout);

// 6. Current User Profile
router.get('/me', requireAuth, getMe);
router.get('/profile', requireAuth, getMe); // Legacy alias

// 7. Update User Profile
router.put('/profile', requireAuth, updateProfile);

// 8. Change Password (supports both POST and PUT)
router.post('/change-password', requireAuth, changePassword);
router.put('/change-password', requireAuth, changePassword);

// 9. Forgot Password
router.post('/forgot-password', forgotPassword);

// 10. Reset Password
router.post('/reset-password', resetPassword);

export { seedDemoUser };
export default router;
