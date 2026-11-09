/**
 * Authentication Middleware
 * Smart Agriculture Assistant Backend
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_ACCESS_SECRET } from '../utils/tokenUtils.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    if (authHeader) {
      if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    // 2. Check HttpOnly cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    // 3. Verify JWT signature & expiration
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired. Please refresh your session or login again.'
        });
      }
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Invalid authentication token.'
      });
    }

    // 4. Fetch authenticated user from MongoDB
    let user = null;
    try {
      user = await User.findById(decoded.id);
    } catch (dbErr) {
      console.warn('⚠️ User lookup in DB encountered issue:', dbErr.message);
    }

    // In-memory fallback if DB is temporarily disconnected
    if (!user && decoded.id) {
      user = {
        _id: decoded.id,
        id: decoded.id,
        fullName: decoded.fullName || decoded.name || 'Farmer',
        mobileNumber: decoded.mobileNumber || decoded.phone || '',
        email: decoded.email || '',
        role: decoded.role || 'farmer',
        isActive: true
      };
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    req.user = user;
    req.userId = user._id ? user._id.toString() : decoded.id;
    next();

  } catch (error) {
    console.error('❌ Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.'
    });
  }
};

export default requireAuth;

