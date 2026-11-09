/**
 * Location Reverse Geocoding Service
 * Smart Agriculture Assistant Backend
 * Uses OpenStreetMap Nominatim with caching, rate limiting, and normalizer.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// In-memory cache for reverse-geocoded coordinates (TTL: 24 hours)
const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

// Reverse Geocoding Configuration
const LOCATIONIQ_BASE_URL = process.env.LOCATIONIQ_BASE_URL || 'https://us1.locationiq.com/v1/reverse';
const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = process.env.GEOCODING_USER_AGENT || 'SmartAgricultureAssistant/1.0 (https://smartagri.org; contact@smartagri.org)';
const TIMEOUT_MS = parseInt(process.env.GEOCODING_TIMEOUT_MS, 10) || 8000;

/**
 * Clean and normalize district names (e.g. "Pune District" -> "Pune")
 */
function cleanDistrictName(name) {
  if (!name) return '';
  return name.replace(/\s+District$/i, '').replace(/\s+Zilla$/i, '').trim();
}

/**
 * Clean and normalize taluka / subdistrict names
 */
function cleanTalukaName(name) {
  if (!name) return '';
  return name
    .replace(/\s+Subdistrict$/i, '')
    .replace(/\s+Tehsil$/i, '')
    .replace(/\s+Taluka$/i, '')
    .replace(/\s+Taluk$/i, '')
    .trim();
}

/**
 * Normalize provider address data to Smart Agriculture Assistant standard location format
 */
export function normalizeLocationData(providerData, latitude, longitude) {
  const address = providerData?.address || {};

  // 1. State
  const state = (address.state || address.province || address.region || '').trim();

  // 2. District
  let rawDistrict = address.state_district || address.district || '';
  let district = cleanDistrictName(rawDistrict);

  // 3. Taluka / Tehsil / Subdistrict
  // In India OSM data, county frequently represents the Taluka/Tehsil (e.g. Daund, Parner, Haveli)
  let rawTaluka = address.county || address.subdistrict || address.tehsil || address.taluk || address.taluka || address.municipality || '';
  let taluka = cleanTalukaName(rawTaluka);

  // Fallback check: If district was missing but county exists and doesn't look like a subdistrict
  if (!district && address.county && !address.county.toLowerCase().includes('subdistrict')) {
    district = cleanDistrictName(address.county);
    taluka = '';
  }

  // Ensure district is not mistakenly duplicated as taluka
  if (taluka && district && taluka.toLowerCase() === district.toLowerCase()) {
    taluka = '';
  }

  // 4. Village / Town / City
  const village = (
    address.village ||
    address.hamlet ||
    address.isolated_dwelling ||
    address.town ||
    address.city ||
    address.suburb ||
    address.neighbourhood ||
    ''
  ).trim();

  // 5. PIN Code
  const pinCode = (address.postcode || address.postal_code || '').trim();

  // 6. Country
  const country = (address.country || 'India').trim();

  // 7. Full Address (Formatted display name)
  const fullAddress = (providerData.display_name || [village, taluka, district, state, country].filter(Boolean).join(', ')).trim();

  return {
    state: state || null,
    district: district || null,
    taluka: taluka || null,
    village: village || null,
    fullAddress: fullAddress || null,
    pinCode: pinCode || null,
    country: country || 'India',
    latitude: Number(latitude),
    longitude: Number(longitude)
  };
}

/**
 * Reverse-geocode latitude and longitude into normalized address information
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object>} Normalized location object
 */
export async function reverseGeocode(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    const err = new Error('Invalid latitude. Latitude must be a number between -90 and 90.');
    err.status = 400;
    throw err;
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    const err = new Error('Invalid longitude. Longitude must be a number between -180 and 180.');
    err.status = 400;
    throw err;
  }

  // Cache key rounded to 4 decimal places (~11 meters)
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const now = Date.now();

  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        cached: true
      };
    }
    geocodeCache.delete(cacheKey);
  }

  const locationIqKey = process.env.LOCATIONIQ_API_KEY ? process.env.LOCATIONIQ_API_KEY.trim() : null;
  let rawData = null;
  let providerUsed = 'none';

  // 1. Attempt LocationIQ Reverse Geocoding if API Key is configured
  if (locationIqKey) {
    try {
      const response = await axios.get(LOCATIONIQ_BASE_URL, {
        params: {
          key: locationIqKey,
          lat: lat,
          lon: lon,
          format: 'json',
          addressdetails: 1,
          normalizeaddress: 1
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: TIMEOUT_MS
      });

      if (response.data && !response.data.error) {
        rawData = response.data;
        providerUsed = 'LocationIQ';
      }
    } catch (locIqErr) {
      // Do not expose or log the private API key
      const status = locIqErr.response?.status;
      console.warn(`⚠️ [LocationIQ] Reverse geocoding failed (HTTP ${status || 'timeout'}): ${locIqErr.message}. Falling back to OpenStreetMap Nominatim.`);
    }
  }

  // 2. Query OpenStreetMap Nominatim if LocationIQ wasn't used or failed
  if (!rawData) {
    try {
      const response = await axios.get(NOMINATIM_BASE_URL, {
        params: {
          format: 'jsonv2',
          lat: lat,
          lon: lon,
          addressdetails: 1
        },
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },
        timeout: TIMEOUT_MS
      });

      if (response.data && !response.data.error) {
        rawData = response.data;
        providerUsed = 'Nominatim';
      } else {
        const errMessage = response.data?.error || 'No location details found for coordinates';
        const error = new Error(errMessage);
        error.status = 404;
        throw error;
      }
    } catch (nomErr) {
      if (nomErr.response?.status === 404 || nomErr.status === 404) {
        const err = new Error('No address found for the provided coordinates.');
        err.status = 404;
        throw err;
      }

      if (nomErr.code === 'ECONNABORTED' || nomErr.message.includes('timeout')) {
        const err = new Error('Reverse geocoding provider request timed out. Please try again.');
        err.status = 504;
        throw err;
      }

      console.error('❌ Reverse geocoding service error:', nomErr.message);
      const serviceError = new Error('Unable to resolve address from coordinates at this time.');
      serviceError.status = 503;
      throw serviceError;
    }
  }

  const normalized = normalizeLocationData(rawData, lat, lon);
  if (providerUsed) {
    normalized.provider = providerUsed;
  }

  // Save in cache (manage size)
  if (geocodeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = geocodeCache.keys().next().value;
    geocodeCache.delete(firstKey);
  }
  geocodeCache.set(cacheKey, { timestamp: now, data: normalized });

  return normalized;
}

export default {
  reverseGeocode,
  normalizeLocationData
};
