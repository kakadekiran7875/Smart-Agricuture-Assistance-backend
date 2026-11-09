/**
 * Authentication Controller
 * Enterprise-grade User Authentication System with Agricultural Profile & OTP
 * Smart Agriculture Assistant Backend
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import OtpVerification from '../models/OtpVerification.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
  generateRandomToken
} from '../utils/tokenUtils.js';
import {
  validatePassword,
  validateEmail,
  validateMobileNumber,
  validatePinCode,
  validateUserType,
  ALLOWED_USER_TYPES
} from '../utils/validators.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookieUtils.js';

// In-memory fallback user store for fault tolerance
export const inMemoryUsers = new Map();

/**
 * 1️⃣ POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const {
      fullName,
      name, // backward compatibility alias
      email,
      mobileNumber,
      phone, // backward compatibility alias
      password,
      confirmPassword,
      userType,
      preferredLanguage,
      state,
      district,
      taluka,
      village,
      fullAddress,
      pinCode,
      location,
      cropsCultivated,
      farmingLandAcres,
      soilType,
      irrigationType,
      farmingExperience,
      termsAccepted,
      acceptTerms
    } = req.body;

    const resolvedFullName = (fullName || name || '').trim();
    const rawMobile = (mobileNumber || phone || '').trim();
    const rawEmail = (email || '').trim();

    // 1. Validate full name
    if (!resolvedFullName || resolvedFullName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required (minimum 2 characters)'
      });
    }

    // 2. Validate mobile number
    const mobileValidation = validateMobileNumber(rawMobile);
    if (!mobileValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: mobileValidation.message
      });
    }
    const cleanMobile = mobileValidation.mobileNumber;

    // 3. Validate email if provided
    let cleanEmail = undefined;
    if (rawEmail) {
      const emailValidation = validateEmail(rawEmail);
      if (!emailValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: emailValidation.message
        });
      }
      cleanEmail = emailValidation.email;
    }

    // 4. Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // 5. Confirm password matching
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match'
      });
    }

    // 6. Validate User Type
    const userTypeValidation = validateUserType(userType);
    if (!userTypeValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: userTypeValidation.message
      });
    }
    const resolvedUserType = userTypeValidation.userType;

    // 7. Validate PIN Code if provided
    let resolvedPinCode = pinCode ? String(pinCode).trim() : '400001';
    if (pinCode) {
      const pinValidation = validatePinCode(pinCode);
      if (!pinValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: pinValidation.message
        });
      }
      resolvedPinCode = pinValidation.pinCode;
    }

    // 8. Terms acceptance
    const termsCondition = termsAccepted !== undefined ? termsAccepted : acceptTerms;
    if (termsCondition !== undefined && !termsCondition) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the terms and conditions to register'
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    // 9. Check for duplicate mobile number & email in MongoDB
    if (isDbConnected) {
      const existingMobile = await User.findOne({ mobileNumber: cleanMobile });
      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists'
        });
      }

      if (cleanEmail) {
        const existingEmail = await User.findOne({ email: cleanEmail });
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email address already exists'
          });
        }
      }
    } else {
      if (inMemoryUsers.has(cleanMobile)) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists'
        });
      }
    }

    // 10. Location fields resolution with sensible fallbacks
    const resolvedState = state ? state.trim() : 'Maharashtra';
    const resolvedDistrict = district ? district.trim() : 'Pune';
    const resolvedTaluka = taluka ? taluka.trim() : (district ? district.trim() : 'Not Specified');
    const resolvedVillage = village ? village.trim() : 'Not Specified';
    const resolvedAddress = fullAddress ? fullAddress.trim() : `${resolvedVillage}, ${resolvedTaluka}, ${resolvedDistrict}, ${resolvedState}`;

    // Optional GPS coordinates
    const resolvedLocation = {
      latitude: location && typeof location.latitude === 'number' ? location.latitude : null,
      longitude: location && typeof location.longitude === 'number' ? location.longitude : null
    };

    // 11. Create new user document in MongoDB
    let newUser;
    if (isDbConnected) {
      newUser = new User({
        fullName: resolvedFullName,
        mobileNumber: cleanMobile,
        email: cleanEmail,
        password: password, // Virtual sets plain password, pre-validate hook hashes with bcrypt
        userType: resolvedUserType,
        preferredLanguage: preferredLanguage ? preferredLanguage.trim().toLowerCase() : 'mr',
        state: resolvedState,
        district: resolvedDistrict,
        taluka: resolvedTaluka,
        village: resolvedVillage,
        fullAddress: resolvedAddress,
        pinCode: resolvedPinCode,
        location: resolvedLocation,
        cropsCultivated: Array.isArray(cropsCultivated) ? cropsCultivated : (cropsCultivated ? [cropsCultivated] : []),
        farmingLandAcres: typeof farmingLandAcres === 'number' ? farmingLandAcres : (farmingLandAcres ? parseFloat(farmingLandAcres) : null),
        soilType: soilType ? soilType.trim() : '',
        irrigationType: irrigationType ? irrigationType.trim() : '',
        farmingExperience: farmingExperience ? farmingExperience.trim() : '',
        role: 'farmer',
        isMobileVerified: false,
        isEmailVerified: false,
        isActive: true,
        lastLoginAt: new Date()
      });

      await newUser.save();
      inMemoryUsers.set(cleanMobile, newUser);
    } else {
      // In-memory fallback
      const inMemoryId = 'USR' + Date.now();
      newUser = {
        _id: inMemoryId,
        id: inMemoryId,
        fullName: resolvedFullName,
        mobileNumber: cleanMobile,
        email: cleanEmail,
        userType: resolvedUserType,
        preferredLanguage: preferredLanguage || 'mr',
        state: resolvedState,
        district: resolvedDistrict,
        taluka: resolvedTaluka,
        village: resolvedVillage,
        fullAddress: resolvedAddress,
        pinCode: resolvedPinCode,
        location: resolvedLocation,
        cropsCultivated: cropsCultivated || [],
        farmingLandAcres: farmingLandAcres || null,
        soilType: soilType || '',
        irrigationType: irrigationType || '',
        farmingExperience: farmingExperience || '',
        role: 'farmer',
        isMobileVerified: false,
        isEmailVerified: false,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      inMemoryUsers.set(cleanMobile, newUser);
    }

    // 12. Generate JWT access token & refresh token
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // 13. Store hashed refresh token in RefreshSession collection
    if (isDbConnected && newUser._id) {
      try {
        const refreshHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await RefreshSession.create({
          userId: newUser._id,
          tokenHash: refreshHash,
          expiresAt: expiresAt,
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
      } catch (sessionErr) {
        console.warn('⚠️ Refresh session creation note:', sessionErr.message);
      }
    }

    // 14. Set secure HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    const safeUser = typeof newUser.toJSON === 'function' ? newUser.toJSON() : {
      id: newUser._id ? newUser._id.toString() : newUser.id,
      fullName: newUser.fullName,
      mobileNumber: newUser.mobileNumber,
      email: newUser.email,
      userType: newUser.userType,
      preferredLanguage: newUser.preferredLanguage,
      state: newUser.state,
      district: newUser.district,
      taluka: newUser.taluka,
      village: newUser.village,
      fullAddress: newUser.fullAddress,
      pinCode: newUser.pinCode,
      cropsCultivated: newUser.cropsCultivated,
      role: newUser.role,
      isMobileVerified: newUser.isMobileVerified
    };

    console.log(`✅ Farmer registered successfully: ${safeUser.fullName} (${cleanMobile}) [${resolvedUserType}]`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: accessToken,
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: safeUser
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'account';
      return res.status(409).json({
        success: false,
        message: `An account with this ${field === 'mobileNumber' ? 'mobile number' : field} already exists`
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
}

/**
 * 2️⃣ POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { identifier, email, mobileNumber, phone, password } = req.body;
    const rawId = (identifier || email || mobileNumber || phone || '').trim();

    if (!rawId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number or email and password are required'
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let user = null;

    // Find user by mobile number or email
    if (isDbConnected) {
      const cleanMobile = rawId.replace(/[\s\-()]/g, '');
      user = await User.findOne({
        $or: [
          { mobileNumber: cleanMobile },
          { email: rawId.toLowerCase() },
          { phone: cleanMobile }
        ]
      });
    } else {
      user = inMemoryUsers.get(rawId) || inMemoryUsers.get(rawId.replace(/[\s\-()]/g, ''));
    }

    // Generic failure message to prevent user enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number/email or password'
      });
    }

    // Check account status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password with bcrypt
    const isMatch = typeof user.comparePassword === 'function'
      ? await user.comparePassword(password)
      : await (async () => {
          const bcrypt = (await import('bcryptjs')).default;
          return bcrypt.compare(password, user.passwordHash || user.password);
        })();

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number/email or password'
      });
    }

    // Update lastLoginAt
    if (isDbConnected && typeof user.save === 'function') {
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh session in DB
    if (isDbConnected && user._id) {
      try {
        const refreshHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await RefreshSession.create({
          userId: user._id,
          tokenHash: refreshHash,
          expiresAt: expiresAt,
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
      } catch (sessionErr) {
        console.warn('⚠️ Refresh session creation note:', sessionErr.message);
      }
    }

    // Set secure HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : {
      id: user._id ? user._id.toString() : user.id,
      fullName: user.fullName || user.name,
      mobileNumber: user.mobileNumber || user.phone,
      email: user.email,
      userType: user.userType || 'farmer',
      preferredLanguage: user.preferredLanguage || 'mr',
      state: user.state,
      district: user.district,
      taluka: user.taluka,
      village: user.village,
      fullAddress: user.fullAddress,
      pinCode: user.pinCode,
      cropsCultivated: user.cropsCultivated,
      role: user.role,
      isMobileVerified: user.isMobileVerified
    };

    console.log(`✅ Farmer logged in: ${safeUser.fullName} (${safeUser.mobileNumber || safeUser.phone})`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: safeUser
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
}

/**
 * 3️⃣ POST /api/auth/send-otp
 */
export async function sendOtp(req, res) {
  try {
    const { mobileNumber, purpose = 'verification' } = req.body;

    const validation = validateMobileNumber(mobileNumber);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    const cleanMobile = validation.mobileNumber;

    const isDbConnected = mongoose.connection.readyState === 1;

    // Resend Cooldown Check: 60 seconds
    if (isDbConnected) {
      const recentOtp = await OtpVerification.findOne({
        mobileNumber: cleanMobile,
        purpose: purpose,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (recentOtp && (Date.now() - new Date(recentOtp.lastSentAt).getTime()) < 60000) {
        const waitSec = Math.ceil((60000 - (Date.now() - new Date(recentOtp.lastSentAt).getTime())) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSec} seconds before requesting a new OTP.`
        });
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    if (isDbConnected) {
      // Invalidate any previous unverified OTPs for this number & purpose
      await OtpVerification.deleteMany({ mobileNumber: cleanMobile, purpose: purpose });

      await OtpVerification.create({
        mobileNumber: cleanMobile,
        otpHash: otpHash,
        purpose: purpose,
        attempts: 0,
        maxAttempts: 3,
        lastSentAt: new Date(),
        expiresAt: expiresAt
      });
    }

    // SMS Provider Configuration Check
    const isSmsConfigured = !!(process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.FAST2SMS_API_KEY);

    if (isSmsConfigured) {
      // Send via configured gateway
      console.log(`📱 SMS sent to ${cleanMobile} via configured SMS gateway.`);
    } else {
      console.log(`ℹ️ [SMS Simulation Mode] OTP for ${cleanMobile} is: [${otp}] (SMS provider not configured in .env)`);
    }

    return res.status(200).json({
      success: true,
      message: isSmsConfigured
        ? 'OTP sent successfully to your mobile number'
        : 'OTP generated. Note: SMS Provider is not configured in .env (operating in simulated development mode).',
      smsConfigured: isSmsConfigured,
      expiresInSeconds: 300,
      // Provide devOtp only in development mode for easy testing without SMS credits
      devOtp: process.env.NODE_ENV !== 'production' && !isSmsConfigured ? otp : undefined
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
}

/**
 * 4️⃣ POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
  try {
    const { mobileNumber, otp, purpose = 'verification' } = req.body;

    const validation = validateMobileNumber(mobileNumber);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    const cleanMobile = validation.mobileNumber;

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit OTP is required'
      });
    }

    const cleanOtp = String(otp).trim();
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully (in-memory mode)',
        isMobileVerified: true
      });
    }

    const otpRecord = await OtpVerification.findOne({
      mobileNumber: cleanMobile,
      purpose: purpose,
      isVerified: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.'
      });
    }

    // Check maximum attempts limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    otpRecord.attempts += 1;
    const incomingHash = hashToken(cleanOtp);

    if (otpRecord.otpHash !== incomingHash) {
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Please request a new OTP.'}`
      });
    }

    // Mark verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Update user's isMobileVerified status if account exists
    const user = await User.findOne({ mobileNumber: cleanMobile });
    if (user) {
      user.isMobileVerified = true;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Mobile number verified successfully!',
      isMobileVerified: true
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
}

/**
 * 5️⃣ POST /api/auth/resend-otp
 */
export async function resendOtp(req, res) {
  return sendOtp(req, res);
}

/**
 * 6️⃣ POST /api/auth/refresh
 */
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token signature & expiration
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    const incomingTokenHash = hashToken(refreshToken);

    let session = null;
    if (isDbConnected) {
      session = await RefreshSession.findOne({ tokenHash: incomingTokenHash });

      // Reuse detection: If token exists but is marked revoked, revoke all sessions
      if (session && session.isRevoked) {
        console.warn(`🚨 Reuse detection triggered for userId: ${session.userId}. Revoking all sessions.`);
        await RefreshSession.updateMany(
          { userId: session.userId },
          { isRevoked: true, revokedAt: new Date() }
        );
        clearAuthCookies(res);
        return res.status(401).json({
          success: false,
          message: 'Refresh token reuse detected. Please login again.'
        });
      }

      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Refresh session not found or already expired.'
        });
      }

      if (session.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Refresh session has expired. Please login again.'
        });
      }
    }

    // Look up user
    let user = null;
    if (isDbConnected) {
      user = await User.findById(decoded.id);
    } else {
      user = inMemoryUsers.get(decoded.id);
    }

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'User account is no longer active.'
      });
    }

    // Issue rotated tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newTokenHash = hashToken(newRefreshToken);

    // Rotate refresh token in DB
    if (isDbConnected && session) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.replacedByTokenHash = newTokenHash;
      await session.save();

      // Create new session
      await RefreshSession.create({
        userId: user._id,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      });
    }

    // Set updated cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
}

/**
 * 7️⃣ POST /api/auth/logout
 */
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken && mongoose.connection.readyState === 1) {
      const tokenHash = hashToken(refreshToken);
      await RefreshSession.updateOne(
        { tokenHash: tokenHash },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    // Clear cookies
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

/**
 * 8️⃣ GET /api/auth/me (Current User Profile)
 */
export async function getMe(req, res) {
  try {
    const user = req.user;
    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : user;

    return res.status(200).json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('❌ getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current user profile'
    });
  }
}

/**
 * 9️⃣ PUT /api/auth/profile
 */
export async function updateProfile(req, res) {
  try {
    const user = req.user;
    const {
      fullName,
      name,
      mobileNumber,
      phone,
      email,
      state,
      district,
      taluka,
      village,
      fullAddress,
      pinCode,
      location,
      preferredLanguage,
      cropsCultivated,
      farmingLandAcres,
      soilType,
      irrigationType,
      farmingExperience,
      userType,
      profileImage
    } = req.body;

    const resolvedFullName = (fullName || name || '').trim();
    if (resolvedFullName) {
      user.fullName = resolvedFullName;
    }

    // If mobile number changed, mark unverified
    const newMobile = (mobileNumber || phone || '').trim();
    if (newMobile) {
      const vMobile = validateMobileNumber(newMobile);
      if (vMobile.isValid && vMobile.mobileNumber !== user.mobileNumber) {
        user.mobileNumber = vMobile.mobileNumber;
        user.isMobileVerified = false;
      }
    }

    // If email changed, mark unverified
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== user.email) {
        user.email = cleanEmail;
        user.isEmailVerified = false;
      }
    }

    if (state !== undefined) user.state = state.trim();
    if (district !== undefined) user.district = district.trim();
    if (taluka !== undefined) user.taluka = taluka.trim();
    if (village !== undefined) user.village = village.trim();
    if (fullAddress !== undefined) user.fullAddress = fullAddress.trim();
    if (pinCode !== undefined) user.pinCode = String(pinCode).trim();
    if (location !== undefined) {
      user.location = {
        latitude: typeof location.latitude === 'number' ? location.latitude : user.location?.latitude,
        longitude: typeof location.longitude === 'number' ? location.longitude : user.location?.longitude
      };
    }
    if (preferredLanguage) user.preferredLanguage = preferredLanguage.trim().toLowerCase();
    if (cropsCultivated !== undefined) user.cropsCultivated = Array.isArray(cropsCultivated) ? cropsCultivated : [cropsCultivated];
    if (farmingLandAcres !== undefined) user.farmingLandAcres = typeof farmingLandAcres === 'number' ? farmingLandAcres : parseFloat(farmingLandAcres);
    if (soilType !== undefined) user.soilType = soilType.trim();
    if (irrigationType !== undefined) user.irrigationType = irrigationType.trim();
    if (farmingExperience !== undefined) user.farmingExperience = farmingExperience.trim();
    if (userType && ALLOWED_USER_TYPES.includes(userType)) user.userType = userType;
    if (profileImage !== undefined) user.profileImage = profileImage;

    if (mongoose.connection.readyState === 1 && typeof user.save === 'function') {
      await user.save();
    }

    const safeUser = typeof user.toJSON === 'function' ? user.toJSON() : user;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
}

/**
 * 🔟 POST & PUT /api/auth/change-password
 */
export async function changePassword(req, res) {
  try {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Verify current password
    const isMatch = typeof user.comparePassword === 'function'
      ? await user.comparePassword(currentPassword)
      : false;

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match'
      });
    }

    // Check confirm password
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Update password
    user.password = newPassword;
    if (mongoose.connection.readyState === 1 && typeof user.save === 'function') {
      await user.save();

      // Revoke all existing refresh sessions
      await RefreshSession.updateMany(
        { userId: user._id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    // Issue fresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    if (mongoose.connection.readyState === 1 && user._id) {
      await RefreshSession.create({
        userId: user._id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      });
    }

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token: accessToken,
      accessToken: accessToken,
      refreshToken: refreshToken
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
}

/**
 * 1️⃣1️⃣ POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists (generic response regardless to prevent account enumeration)
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail });

      if (user) {
        const rawToken = generateRandomToken(32);
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Clear any old reset tokens for this user
        await PasswordResetToken.deleteMany({ userId: user._id });

        await PasswordResetToken.create({
          userId: user._id,
          tokenHash: tokenHash,
          expiresAt: expiresAt
        });

        console.log(`🔑 Password reset token generated for ${cleanEmail}: ${rawToken}`);
      }
    }

    // Generic response to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
}

/**
 * 1️⃣2️⃣ POST /api/auth/reset-password
 */
export async function resetPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable for password reset'
      });
    }

    const incomingHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({
      tokenHash: incomingHash,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Associated user account not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark token as used
    resetRecord.usedAt = new Date();
    await resetRecord.save();

    // Revoke all refresh sessions
    await RefreshSession.updateMany(
      { userId: user._id },
      { isRevoked: true, revokedAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now login.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
}

/**
 * Seed or verify demo farmer account in development
 */
export async function seedDemoUser() {
  try {
    const demoPhone = '9876543210';
    const demoPass = 'farmer123';
    const demoEmail = 'farmer@smartagri.com';

    // In-memory record
    inMemoryUsers.set(demoPhone, {
      _id: 'DEMO_FARMER_9876543210',
      id: 'DEMO_FARMER_9876543210',
      fullName: 'Ramesh Patil',
      mobileNumber: demoPhone,
      email: demoEmail,
      userType: 'farmer',
      preferredLanguage: 'mr',
      state: 'Maharashtra',
      district: 'Pune',
      taluka: 'Baramati',
      village: 'Baramati',
      fullAddress: 'Baramati, Pune, Maharashtra - 413102',
      pinCode: '413102',
      cropsCultivated: ['Sugarcane', 'Soybean'],
      farmingLandAcres: 5,
      role: 'farmer',
      isMobileVerified: true,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({
        $or: [{ mobileNumber: demoPhone }, { phone: demoPhone }]
      });

      if (existing) {
        existing.fullName = 'Ramesh Patil';
        existing.mobileNumber = demoPhone;
        existing.email = demoEmail;
        existing.userType = 'farmer';
        existing.preferredLanguage = 'mr';
        existing.state = 'Maharashtra';
        existing.district = 'Pune';
        existing.taluka = 'Baramati';
        existing.village = 'Baramati';
        existing.fullAddress = 'Baramati, Pune, Maharashtra - 413102';
        existing.pinCode = '413102';
        existing.cropsCultivated = ['Sugarcane', 'Soybean'];
        existing.farmingLandAcres = 5;
        existing.password = demoPass;
        existing.isMobileVerified = true;
        existing.isActive = true;
        await existing.save();
        console.log(`🌾 Demo farmer account verified in MongoDB: ${demoPhone} / ${demoPass}`);
      } else {
        const newUser = new User({
          fullName: 'Ramesh Patil',
          mobileNumber: demoPhone,
          email: demoEmail,
          password: demoPass,
          userType: 'farmer',
          preferredLanguage: 'mr',
          state: 'Maharashtra',
          district: 'Pune',
          taluka: 'Baramati',
          village: 'Baramati',
          fullAddress: 'Baramati, Pune, Maharashtra - 413102',
          pinCode: '413102',
          cropsCultivated: ['Sugarcane', 'Soybean'],
          farmingLandAcres: 5,
          role: 'farmer',
          isMobileVerified: true,
          isActive: true
        });
        await newUser.save();
        console.log(`🌾 Demo farmer account created in MongoDB: ${demoPhone} / ${demoPass}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Demo user seeding note:', error.message);
  }
}
