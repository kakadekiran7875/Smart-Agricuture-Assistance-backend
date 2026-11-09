/**
 * Cookie Management Utilities for Secure Authentication
 * Smart Agriculture Assistant Backend
 */

import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;

/**
 * Common cookie options
 */
export function getCookieOptions(type = 'access') {
  // SameSite='None' requires Secure=true in browsers (for cross-origin requests)
  const isCrossOrigin = isProduction;

  const baseOptions = {
    httpOnly: true,
    secure: isCrossOrigin,
    sameSite: isCrossOrigin ? 'none' : 'lax',
    path: '/'
  };

  if (type === 'access') {
    return {
      ...baseOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    };
  }

  if (type === 'refresh') {
    return {
      ...baseOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  return baseOptions;
}

/**
 * Set authentication cookies on response
 */
export function setAuthCookies(res, accessToken, refreshToken) {
  if (accessToken) {
    res.cookie('accessToken', accessToken, getCookieOptions('access'));
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, getCookieOptions('refresh'));
  }
}

/**
 * Clear authentication cookies on logout
 */
export function clearAuthCookies(res) {
  const accessOpts = { ...getCookieOptions('access'), maxAge: 0 };
  const refreshOpts = { ...getCookieOptions('refresh'), maxAge: 0 };

  res.clearCookie('accessToken', accessOpts);
  res.clearCookie('refreshToken', refreshOpts);
}

