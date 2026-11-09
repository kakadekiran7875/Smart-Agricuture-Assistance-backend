/**
 * Location Controller
 * Reverse Geocoding & Location Normalization
 * Smart Agriculture Assistant Backend
 */

import { reverseGeocode } from '../services/locationService.js';

/**
 * POST & GET /api/location/reverse-geocode
 * Converts GPS coordinates (lat, lon) into a structured Indian agricultural address
 */
export async function reverseGeocodeLocation(req, res) {
  try {
    const rawLat = req.body?.latitude ?? req.query?.latitude ?? req.body?.lat ?? req.query?.lat;
    const rawLon = req.body?.longitude ?? req.query?.longitude ?? req.body?.lon ?? req.query?.lon;

    // 1. Check coordinates presence
    if (rawLat === undefined || rawLat === null || rawLat === '' ||
        rawLon === undefined || rawLon === null || rawLon === '') {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude are required.'
      });
    }

    const latitude = Number(rawLat);
    const longitude = Number(rawLon);

    // 2. Validate numeric values
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers.'
      });
    }

    // 3. Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90 degrees.'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180 degrees.'
      });
    }

    // 4. Reverse geocode via provider
    const location = await reverseGeocode(latitude, longitude);

    return res.status(200).json({
      success: true,
      message: 'Location detected successfully',
      location: location
    });

  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Error occurred while resolving coordinates to location.'
    });
  }
}

export default {
  reverseGeocodeLocation
};

