import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// OpenWeather API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

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

    // If no API key, return demo data
    if (!OPENWEATHER_API_KEY) {
      console.log("⚠️  No API key found, returning demo data");
      const weatherData = {
        location,
        temperature: 31,
        humidity: 68,
        condition: "Sunny",
        note: "Demo data - Add OPENWEATHER_API_KEY to .env for real data"
      };
      return res.json(weatherData);
    }

    // Fetch real weather data from OpenWeather API
    const url = `${OPENWEATHER_BASE_URL}/weather`;
    const response = await axios.get(url, {
      params: {
        q: location,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    
    console.log(`✅ Weather fetched: ${data.main.temp}°C, ${data.weather[0].main}`);

    // Format response
    const weatherData = {
      location: data.name,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      feelsLike: Math.round(data.main.feels_like),
      windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, // m/s to km/h
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // meters to km
      cloudiness: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString()
    };

    res.json(weatherData);
  } catch (error) {
    console.error("❌ Weather API error:", error.message);
    
    // Return demo data on error
    const weatherData = {
      location: req.params.location,
      temperature: 31,
      humidity: 68,
      condition: "Sunny",
      error: "Could not fetch real-time data",
      message: error.response?.data?.message || error.message
    };
    
    res.json(weatherData);
  }
});

// GET: Weather data for frontend (new endpoint with forecast)
router.get("/", async (req, res) => {
  try {
    const location = req.query.location || req.query.city || "Pune"; // Default location
    
    console.log(`🌤️  Fetching detailed weather for: ${location}`);

    // If no API key, return demo data
    if (!OPENWEATHER_API_KEY) {
      console.log("⚠️  No API key found, returning demo data");
      const weatherData = {
        current: {
          temperature: 28,
          humidity: 65,
          rainfall: 0,
          windSpeed: 12,
          condition: "Partly Cloudy",
          location: location
        },
        forecast: [
          { day: "Today", temp: "28°C", condition: "Partly Cloudy", rain: "10%" },
          { day: "Tomorrow", temp: "30°C", condition: "Sunny", rain: "5%" },
          { day: "Day 3", temp: "26°C", condition: "Rainy", rain: "80%" },
          { day: "Day 4", temp: "24°C", condition: "Cloudy", rain: "40%" },
          { day: "Day 5", temp: "29°C", condition: "Sunny", rain: "0%" }
        ],
        advisory: "Good conditions for spraying pesticides. Avoid irrigation for next 2 days due to expected rainfall.",
        note: "Demo data - Add OPENWEATHER_API_KEY to .env for real data"
      };
      return res.json(weatherData);
    }

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

    console.log(`✅ Weather & forecast fetched for ${current.name}`);

    // Process forecast data (get one reading per day at noon)
    const dailyForecasts = [];
    const processedDates = new Set();
    
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toDateString();
      const hour = date.getHours();
      
      // Get forecast around noon (12:00) for each day
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

    // Generate farming advisory based on weather
    let advisory = generateAdvisory(current, dailyForecasts);

    // Format response
    const weatherData = {
      current: {
        location: current.name,
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
      forecast: dailyForecasts.slice(0, 5), // Next 5 days
      advisory: advisory,
      lastUpdated: new Date().toISOString()
    };

    res.json(weatherData);
  } catch (error) {
    console.error("❌ Weather API error:", error.message);
    
    // Return demo data on error
    const weatherData = {
      current: {
        temperature: 28,
        humidity: 65,
        rainfall: 0,
        windSpeed: 12,
        condition: "Partly Cloudy",
        location: req.query.location || "Unknown"
      },
      forecast: [
        { day: "Today", temp: "28°C", condition: "Partly Cloudy", rain: "10%" },
        { day: "Tomorrow", temp: "30°C", condition: "Sunny", rain: "5%" },
        { day: "Day 3", temp: "26°C", condition: "Rainy", rain: "80%" },
        { day: "Day 4", temp: "24°C", condition: "Cloudy", rain: "40%" },
        { day: "Day 5", temp: "29°C", condition: "Sunny", rain: "0%" }
      ],
      advisory: "Good conditions for spraying pesticides. Avoid irrigation for next 2 days due to expected rainfall.",
      error: "Could not fetch real-time data",
      message: error.response?.data?.message || error.message
    };
    
    res.json(weatherData);
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
