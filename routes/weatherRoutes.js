import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// OpenWeather API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Open-Meteo API (Free, no API key required)
const OPENMETEO_BASE_URL = "https://api.open-meteo.com/v1";

// Geocoding API for Open-Meteo
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * Get coordinates for location name using Open-Meteo Geocoding
 * @param {string} location - City name
 * @returns {object} Latitude and longitude
 */
async function getCoordinates(location) {
  try {
    const response = await axios.get(GEOCODING_URL, {
      params: {
        name: location,
        count: 1,
        language: 'en',
        format: 'json'
      },
      timeout: 5000
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        name: result.name,
        country: result.country,
        admin1: result.admin1 // State/Province
      };
    }
    return null;
  } catch (error) {
    console.error("❌ Geocoding error:", error.message);
    return null;
  }
}

/**
 * Fetch weather from Open-Meteo (Free API)
 * @param {string} location - Location name
 * @returns {object} Weather data
 */
async function fetchOpenMeteoWeather(location) {
  try {
    const coords = await getCoordinates(location);
    if (!coords) {
      throw new Error(`Location "${location}" not found`);
    }

    console.log(`🌤️  Fetching Open-Meteo weather for: ${coords.name} (${coords.lat}, ${coords.lon})`);

    // Fetch current weather + forecast
    const response = await axios.get(OPENMETEO_BASE_URL + '/forecast', {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,precipitation,cloud_cover,visibility',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: 6
      },
      timeout: 10000
    });

    const data = response.data;

    // Map Open-Meteo weather codes to conditions
    const weatherCodeMap = {
      0: { main: "Clear", description: "clear sky", icon: "☀️" },
      1: { main: "Partly Cloudy", description: "mainly clear", icon: "🌤️" },
      2: { main: "Partly Cloudy", description: "partly cloudy", icon: "⛅" },
      3: { main: "Cloudy", description: "overcast", icon: "☁️" },
      45: { main: "Fog", description: "fog", icon: "🌫️" },
      48: { main: "Fog", description: "depositing rime fog", icon: "🌫️" },
      51: { main: "Drizzle", description: "light drizzle", icon: "🌦️" },
      53: { main: "Drizzle", description: "moderate drizzle", icon: "🌦️" },
      55: { main: "Drizzle", description: "dense drizzle", icon: "🌧️" },
      61: { main: "Rain", description: "slight rain", icon: "🌧️" },
      63: { main: "Rain", description: "moderate rain", icon: "🌧️" },
      65: { main: "Rain", description: "heavy rain", icon: "🌧️" },
      71: { main: "Snow", description: "slight snow", icon: "🌨️" },
      73: { main: "Snow", description: "moderate snow", icon: "❄️" },
      75: { main: "Snow", description: "heavy snow", icon: "❄️" },
      95: { main: "Thunderstorm", description: "thunderstorm", icon: "⛈️" }
    };

    const current = data.current;
    const weatherCode = current.weather_code;
    const weatherInfo = weatherCodeMap[weatherCode] || { main: "Unknown", description: "unknown", icon: "❓" };

    // Build forecast array
    const dailyForecasts = [];
    const daily = data.daily;
    
    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
      const dayCode = daily.weather_code[i];
      const dayInfo = weatherCodeMap[dayCode] || { main: "Unknown", icon: "❓" };
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' });
      
      dailyForecasts.push({
        day: dayName,
        date: daily.time[i],
        temp: `${Math.round(daily.temperature_2m_max[i])}°C`,
        condition: dayInfo.main,
        description: dayInfo.description,
        rain: `${daily.precipitation_probability_max[i] || 0}%`,
        rainAmount: `${daily.precipitation_sum[i] || 0}mm`,
        icon: dayInfo.icon
      });
    }

    // Generate advisory
    let advisory = generateAdvisoryFromOpenMeteo(current, dailyForecasts);

    return {
      success: true,
      source: 'open-meteo',
      location: {
        name: coords.name,
        admin1: coords.admin1,
        country: coords.country,
        latitude: coords.lat,
        longitude: coords.lon
      },
      current: {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        rainfall: current.precipitation || 0,
        windSpeed: Math.round(current.wind_speed_10m * 3.6 * 10) / 10, // m/s to km/h
        condition: weatherInfo.main,
        description: weatherInfo.description,
        pressure: Math.round(current.pressure_msl),
        visibility: current.visibility ? Math.round(current.visibility / 1000) : 10,
        cloudiness: current.cloud_cover,
        icon: weatherInfo.icon,
        time: data.current.time
      },
      forecast: dailyForecasts,
      advisory: advisory,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("❌ Open-Meteo error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate farming advisory from Open-Meteo data
 */
function generateAdvisoryFromOpenMeteo(current, forecast) {
  const advisories = [];

  // Temperature advisory
  if (current.temperature_2m > 35) {
    advisories.push("High temperature alert. Ensure adequate irrigation for crops.");
  } else if (current.temperature_2m < 15) {
    advisories.push("Low temperature. Protect sensitive crops from cold stress.");
  }

  // Rain advisory
  const upcomingRain = forecast.some(day => parseInt(day.rain) > 50);
  if (upcomingRain) {
    advisories.push("Heavy rainfall expected. Postpone pesticide/fertilizer application.");
  } else if (current.weather_code <= 1) {
    advisories.push("Good conditions for spraying pesticides and fertilizers.");
  }

  // Humidity advisory
  if (current.relative_humidity_2m > 80) {
    advisories.push("High humidity may increase disease risk. Monitor crops closely.");
  }

  // Wind advisory
  const windSpeed = current.wind_speed_10m * 3.6; // m/s to km/h
  if (windSpeed > 20) {
    advisories.push("High wind speed. Avoid spraying operations.");
  }

  // Default advisory
  if (advisories.length === 0) {
    advisories.push("Weather conditions are favorable for regular farming activities.");
  }

  return advisories.join(" ");
}

// GET: Provide weather info for a given location (old endpoint)
router.get("/:location", async (req, res) => {
  try {
    const { location } = req.params;

    if (!location) {
      return res.status(400).json({ 
        error: "location is required" 
      });
    }

    console.log(`🌤️  Fetching weather for: ${location}`);

    // Try Open-Meteo first (Free, no API key needed)
    const openMeteoResult = await fetchOpenMeteoWeather(location);
    if (openMeteoResult.success) {
      // Simplified response for old endpoint
      return res.json({
        location: openMeteoResult.location.name,
        temperature: openMeteoResult.current.temperature,
        humidity: openMeteoResult.current.humidity,
        condition: openMeteoResult.current.condition,
        description: openMeteoResult.current.description,
        feelsLike: openMeteoResult.current.feelsLike,
        windSpeed: openMeteoResult.current.windSpeed,
        pressure: openMeteoResult.current.pressure,
        visibility: openMeteoResult.current.visibility,
        cloudiness: openMeteoResult.current.cloudiness,
        source: 'open-meteo',
        note: 'Free weather data from Open-Meteo'
      });
    }

    // Fallback to OpenWeather if API key exists
    if (OPENWEATHER_API_KEY) {
      try {
        const url = `${OPENWEATHER_BASE_URL}/weather`;
        const response = await axios.get(url, {
          params: {
            q: location,
            appid: OPENWEATHER_API_KEY,
            units: 'metric'
          }
        });

        const data = response.data;
        
        console.log(`✅ OpenWeather fetched: ${data.main.temp}°C, ${data.weather[0].main}`);

        return res.json({
          location: data.name,
          temperature: Math.round(data.main.temp),
          humidity: data.main.humidity,
          condition: data.weather[0].main,
          description: data.weather[0].description,
          feelsLike: Math.round(data.main.feels_like),
          windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10,
          pressure: data.main.pressure,
          visibility: data.visibility / 1000,
          cloudiness: data.clouds.all,
          sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
          sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
          source: 'openweather'
        });
      } catch (owError) {
        console.error("❌ OpenWeather fallback error:", owError.message);
      }
    }

    // Final fallback: demo data
    console.log("⚠️  Returning demo weather data");
    res.json({
      location: location,
      temperature: 31,
      humidity: 68,
      condition: "Sunny",
      description: "clear sky",
      feelsLike: 33,
      windSpeed: 12,
      pressure: 1013,
      visibility: 10,
      cloudiness: 10,
      source: 'demo',
      note: 'Demo data - Using sample weather values'
    });
  } catch (error) {
    console.error("❌ Weather API error:", error.message);
    
    // Return demo data on error
    res.json({
      location: req.params.location,
      temperature: 31,
      humidity: 68,
      condition: "Sunny",
      error: "Could not fetch real-time data",
      message: error.message,
      source: 'demo-error'
    });
  }
});

// GET: Weather data for frontend (new endpoint with forecast)
router.get("/", async (req, res) => {
  try {
    const location = req.query.location || req.query.city || "Pune"; // Default location
    
    console.log(`🌤️  Fetching detailed weather for: ${location}`);

    // Try Open-Meteo first (Free, no API key needed)
    const openMeteoResult = await fetchOpenMeteoWeather(location);
    if (openMeteoResult.success) {
      console.log(`✅ Open-Meteo weather fetched for ${openMeteoResult.location.name}`);
      return res.json(openMeteoResult);
    }

    // Fallback to OpenWeather if API key exists
    if (OPENWEATHER_API_KEY) {
      try {
        // Fetch current weather
        const currentUrl = `${OPENWEATHER_BASE_URL}/weather`;
        const currentResponse = await axios.get(currentUrl, {
          params: {
            q: location,
            appid: OPENWEATHER_API_KEY,
            units: 'metric'
          }
        });

        const current = currentResponse.data;

        // Fetch 5-day forecast
        const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast`;
        const forecastResponse = await axios.get(forecastUrl, {
          params: {
            q: location,
            appid: OPENWEATHER_API_KEY,
            units: 'metric'
          }
        });

        const forecast = forecastResponse.data;

        console.log(`✅ OpenWeather fetched for ${current.name}`);

        // Process forecast data
        const dailyForecasts = [];
        const processedDates = new Set();
        
        forecast.list.forEach(item => {
          const date = new Date(item.dt * 1000);
          const dateStr = date.toDateString();
          const hour = date.getHours();
          
          if (!processedDates.has(dateStr) && hour >= 11 && hour <= 14) {
            processedDates.add(dateStr);
            
            const dayName = dailyForecasts.length === 0 ? "Today" : 
                           dailyForecasts.length === 1 ? "Tomorrow" : 
                           date.toLocaleDateString('en-US', { weekday: 'short' });
            
            dailyForecasts.push({
              day: dayName,
              date: date.toLocaleDateString(),
              temp: `${Math.round(item.main.temp)}°C`,
              condition: item.weather[0].main,
              description: item.weather[0].description,
              rain: item.pop ? `${Math.round(item.pop * 100)}%` : "0%",
              humidity: item.main.humidity,
              windSpeed: Math.round(item.wind.speed * 3.6)
            });
          }
        });

        let advisory = generateAdvisory(current, dailyForecasts);

        return res.json({
          success: true,
          source: 'openweather',
          location: {
            name: current.name,
            country: current.sys.country
          },
          current: {
            temperature: Math.round(current.main.temp),
            feelsLike: Math.round(current.main.feels_like),
            humidity: current.main.humidity,
            rainfall: current.rain?.['1h'] || 0,
            windSpeed: Math.round(current.wind.speed * 3.6 * 10) / 10,
            condition: current.weather[0].main,
            description: current.weather[0].description,
            pressure: current.main.pressure,
            visibility: current.visibility / 1000,
            cloudiness: current.clouds.all,
            sunrise: new Date(current.sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(current.sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          },
          forecast: dailyForecasts.slice(0, 5),
          advisory: advisory,
          lastUpdated: new Date().toISOString()
        });
      } catch (owError) {
        console.error("❌ OpenWeather fallback error:", owError.message);
      }
    }

    // Final fallback: demo data
    console.log("⚠️  Returning demo weather data");
    const demoData = {
      success: true,
      source: 'demo',
      location: { name: location, country: 'IN' },
      current: {
        temperature: 28,
        feelsLike: 30,
        humidity: 65,
        rainfall: 0,
        windSpeed: 12,
        condition: "Partly Cloudy",
        description: "partly cloudy",
        pressure: 1012,
        visibility: 10,
        cloudiness: 40,
        sunrise: "06:15 AM",
        sunset: "06:45 PM"
      },
      forecast: [
        { day: "Today", date: new Date().toLocaleDateString(), temp: "28°C", condition: "Partly Cloudy", description: "partly cloudy", rain: "10%", rainAmount: "0mm", icon: "⛅" },
        { day: "Tomorrow", date: new Date(Date.now() + 86400000).toLocaleDateString(), temp: "30°C", condition: "Sunny", description: "clear sky", rain: "5%", rainAmount: "0mm", icon: "☀️" },
        { day: "Day 3", date: new Date(Date.now() + 172800000).toLocaleDateString(), temp: "26°C", condition: "Rainy", description: "rain", rain: "80%", rainAmount: "15mm", icon: "🌧️" },
        { day: "Day 4", date: new Date(Date.now() + 259200000).toLocaleDateString(), temp: "24°C", condition: "Cloudy", description: "cloudy", rain: "40%", rainAmount: "5mm", icon: "☁️" },
        { day: "Day 5", date: new Date(Date.now() + 345600000).toLocaleDateString(), temp: "29°C", condition: "Sunny", description: "clear sky", rain: "0%", rainAmount: "0mm", icon: "☀️" }
      ],
      advisory: "Good conditions for spraying pesticides. Avoid irrigation for next 2 days due to expected rainfall.",
      note: 'Demo data - No free weather API available',
      lastUpdated: new Date().toISOString()
    };
    return res.json(demoData);
  } catch (error) {
    console.error("❌ Weather API error:", error.message);
    
    // Return demo data on error
    res.json({
      success: true,
      source: 'demo-error',
      location: { name: req.query.location || "Unknown", country: 'IN' },
      current: {
        temperature: 28,
        feelsLike: 30,
        humidity: 65,
        rainfall: 0,
        windSpeed: 12,
        condition: "Partly Cloudy",
        description: "partly cloudy",
        pressure: 1012,
        visibility: 10,
        cloudiness: 40,
        sunrise: "06:15 AM",
        sunset: "06:45 PM"
      },
      forecast: [
        { day: "Today", temp: "28°C", condition: "Partly Cloudy", description: "partly cloudy", rain: "10%", icon: "⛅" },
        { day: "Tomorrow", temp: "30°C", condition: "Sunny", description: "clear sky", rain: "5%", icon: "☀️" },
        { day: "Day 3", temp: "26°C", condition: "Rainy", description: "rain", rain: "80%", icon: "🌧️" },
        { day: "Day 4", temp: "24°C", condition: "Cloudy", description: "cloudy", rain: "40%", icon: "☁️" },
        { day: "Day 5", temp: "29°C", condition: "Sunny", description: "clear sky", rain: "0%", icon: "☀️" }
      ],
      advisory: "Weather data unavailable. Using demo values for reference.",
      error: error.message,
      lastUpdated: new Date().toISOString()
    });
  }
});

// Helper function to generate farming advisory
function generateAdvisory(current, forecast) {
  const advisories = [];
  
  // Temperature advisory
  if (current.main.temp > 35) {
    advisories.push("High temperature alert. Ensure adequate irrigation for crops.");
  } else if (current.main.temp < 15) {
    advisories.push("Low temperature. Protect sensitive crops from cold stress.");
  }
  
  // Rain advisory
  const upcomingRain = forecast.some(day => parseInt(day.rain) > 50);
  if (upcomingRain) {
    advisories.push("Heavy rainfall expected. Postpone pesticide/fertilizer application.");
  } else if (current.weather[0].main === "Clear") {
    advisories.push("Good conditions for spraying pesticides and fertilizers.");
  }
  
  // Humidity advisory
  if (current.main.humidity > 80) {
    advisories.push("High humidity may increase disease risk. Monitor crops closely.");
  }
  
  // Wind advisory
  const windSpeed = current.wind.speed * 3.6; // m/s to km/h
  if (windSpeed > 20) {
    advisories.push("High wind speed. Avoid spraying operations.");
  }
  
  // Default advisory
  if (advisories.length === 0) {
    advisories.push("Weather conditions are favorable for regular farming activities.");
  }
  
  return advisories.join(" ");
}

export default router;
