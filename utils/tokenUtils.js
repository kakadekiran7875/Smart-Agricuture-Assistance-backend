/**
 * JWT & Cryptographic Token Utilities
 * Smart Agriculture Assistant Backend
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'smart_agriculture_access_token_secret_key_2026_xyz';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET + '_refresh' : 'smart_agriculture_refresh_token_secret_key_2026_abc');
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate a short-lived access token (default 15m)
 */
export function generateAccessToken(user) {
  const userId = user._id ? user._id.toString() : user.id;
  const payload = {
    id: userId,
    role: user.role || 'farmer',
    email: user.email || '',
    mobileNumber: user.mobileNumber || user.phone || '',
    fullName: user.fullName || user.name || 'Farmer'
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });
}

/**
 * Generate a long-lived refresh token (default 7d)
 */
export function generateRefreshToken(user) {
  const userId = user._id ? user._id.toString() : user.id;
  const jti = crypto.randomUUID();

  return jwt.sign(
    {
      id: userId,
      jti: jti,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN
    }
  );
}

/**
 * Hash a token with SHA-256 for secure database storage
 */
export function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Generate a random URL-safe token (e.g. for password reset)
 */
export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
};

