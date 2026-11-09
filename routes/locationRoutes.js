/**
 * Location Routes
 * Smart Agriculture Assistant Backend
 * Base URL: /api/location
 */

import express from 'express';
import { reverseGeocode } from '../services/locationService.js';

const router = express.Router();

/**
 * POST /api/location/reverse-geocode
 * Resolves GPS coordinates (latitude, longitude) into normalized address details
 */
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude are required.'
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers.'
      });
    }

    const location = await reverseGeocode(lat, lon);

    return res.status(200).json({
      success: true,
      location: location
    });
  } catch (error) {
    console.error('❌ Location reverse geocode error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to resolve address from coordinates'
    });
  }
});

export default router;
