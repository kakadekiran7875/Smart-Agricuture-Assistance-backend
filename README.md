# Smart Agriculture Assistant Backend API
## स्मार्ट कृषी सहाय्यक बॅकएंड API

A Node.js backend API for Smart Agriculture Assistant with Marathi language support.

## Features

- 🌱 **Crop Recommendation** - Get crop suggestions based on soil and weather parameters
- 🌍 **Soil Analysis** - Analyze soil health and get recommendations
- 💊 **Fertilizer Recommendation** - Get fertilizer suggestions for crops
- 🐛 **Pest Control** - Get pest control methods and solutions
- 💰 **Market Price** - Check current market prices for crops
- 🌤️ **Weather Information** - Get weather forecast and advisory
- 🌐 **Multi-language Support** - English, Marathi (मराठी), Hindi (हिंदी)

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (optional)
- **Mongoose** - ODM for MongoDB

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory (copy from `.env.example`):
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agriculture
```

3. **Start the server:**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5001`

## API Endpoints

### Base URL
```
http://localhost:5001/api
```

### 1. Crop Recommendation
**POST** `/api/crops/recommend`

Get crop recommendations based on soil and weather parameters.

**Request Body:**
```json
{
  "nitrogen": 90,
  "phosphorus": 42,
  "potassium": 43,
  "temperature": 20.5,
  "humidity": 82,
  "ph": 6.5,
  "rainfall": 202,
  "language": "mr"
}
```

**Response:**
```json
{
  "recommended_crops": ["तांदूळ", "गहू", "मका"],
  "confidence": 0.83,
  "explanation": "तुमच्या मातीच्या आणि हवामानाच्या परिस्थितीनुसार, या पिकांची शिफारस केली जाते. माती pH: 6.5, तापमान: 20.5°C",
  "language": "mr"
}
```

### 2. Soil Analysis
**POST** `/api/soil/analyze`

Analyze soil health and get recommendations.

**Request Body:**
```json
{
  "nitrogen": 45,
  "phosphorus": 25,
  "potassium": 35,
  "ph": 5.8,
  "soil_type": "clay",
  "language": "mr"
}
```

**Response:**
```json
{
  "soil_health": "चांगली",
  "recommendations": ["युरिया किंवा अमोनियम सल्फेट वापरा"],
  "deficiencies": ["नायट्रोजनची कमतरता", "फॉस्फरसची कमतरता"],
  "language": "mr"
}
```

### 3. Fertilizer Recommendation
**POST** `/api/fertilizer/recommend`

Get fertilizer recommendations for specific crop and growth stage.

**Request Body:**
```json
{
  "crop": "rice",
  "soil_type": "loamy",
  "nitrogen": 50,
  "phosphorus": 40,
  "potassium": 45,
  "growth_stage": "vegetative",
  "language": "mr"
}
```

**Response:**
```json
{
  "fertilizer_type": "युरिया आणि NPK मिश्रण",
  "quantity": "100 किलो युरिया + 50 किलो NPK प्रति हेक्टर",
  "application_method": "पिकाच्या ओळीच्या बाजूला टाका आणि माती मिसळा",
  "timing": "पेरणीनंतर 3-4 आठवड्यांनी",
  "precautions": ["पाण्याची उपलब्धता सुनिश्चित करा", "पावसाळ्यात देण्याचे टाळा"],
  "language": "mr"
}
```

### 4. Pest Control
**POST** `/api/pest/control`

Get pest control methods and solutions.

**Request Body:**
```json
{
  "crop": "cotton",
  "pest_description": "small white insects on leaves",
  "language": "mr"
}
```

**Response:**
```json
{
  "identified_pest": "सामान्य कीटक",
  "control_methods": ["नियमित शेत तपासणी करा", "प्रभावित पाने काढून टाका"],
  "organic_solutions": ["नीम तेल फवारणी", "गोमूत्र मिश्रण"],
  "chemical_solutions": ["स्थानिक कृषी विभागाशी संपर्क साधा"],
  "language": "mr"
}
```

### 5. Market Price
**POST** `/api/market/price`

Get current market prices for crops.

**Request Body:**
```json
{
  "crop": "onion",
  "location": "Pune",
  "language": "mr"
}
```

**Response:**
```json
{
  "crop": "कांदा",
  "location": "Pune",
  "current_price": "₹1500 प्रति क्विंटल",
  "price_trend": "स्थिर ते किंचित वाढणारा",
  "market_advisory": "कांदाची मागणी चांगली आहे. जवळच्या मंडीत विक्री करा.",
  "language": "mr"
}
```

### 6. Weather Information
**POST** `/api/weather/info`

Get weather forecast and advisory.

**Request Body:**
```json
{
  "location": "Mumbai",
  "language": "mr"
}
```

**Response:**
```json
{
  "location": "Mumbai",
  "temperature": 28.5,
  "humidity": 65,
  "rainfall_forecast": "पुढील 3 दिवसात मध्यम पाऊस",
  "advisory": "पेरणीसाठी योग्य वातावरण. पाणी निचरा व्यवस्थित ठेवा.",
  "language": "mr"
}
```

## Language Support

The API supports three languages:
- `en` - English
- `mr` - Marathi (मराठी)
- `hi` - Hindi (हिंदी)

Pass the `language` parameter in the request body to get responses in your preferred language.

## Supported Crops

- Rice (तांदूळ)
- Wheat (गहू)
- Cotton (कापूस)
- Sugarcane (ऊस)
- Soybean (सोयाबीन)
- Maize (मका)
- Groundnut (शेंगदाणा)
- Onion (कांदा)
- Potato (बटाटा)
- Tomato (टोमॅटो)

## Project Structure

```
├── config/
│   └── database.js          # Database configuration
├── models/
│   └── Query.js             # Query model for MongoDB
├── routes/
│   ├── cropRoutes.js        # Crop recommendation routes
│   ├── soilRoutes.js        # Soil analysis routes
│   ├── fertilizerRoutes.js  # Fertilizer routes
│   ├── pestRoutes.js        # Pest control routes
│   ├── marketRoutes.js      # Market price routes
│   └── weatherRoutes.js     # Weather routes
├── services/
│   └── agricultureService.js # Core agriculture logic
├── utils/
│   └── translations.js      # Translation utilities
├── server.js                # Main server file
├── package.json             # Dependencies
└── .env                     # Environment variables
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include both English and Marathi messages:
```json
{
  "error": "Missing required fields",
  "error_mr": "आवश्यक माहिती उपलब्ध नाही"
}
```

## Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-09T09:30:00.000Z"
}
```

## Testing with cURL

### Example: Crop Recommendation
```bash
curl -X POST http://localhost:5000/api/crops/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "nitrogen": 90,
    "phosphorus": 42,
    "potassium": 43,
    "temperature": 20.5,
    "humidity": 82,
    "ph": 6.5,
    "rainfall": 202,
    "language": "mr"
  }'
```

## Testing with Postman

1. Import the API endpoints into Postman
2. Set the request method to POST
3. Set the URL to `http://localhost:5000/api/{endpoint}`
4. Set Headers: `Content-Type: application/json`
5. Add the request body in JSON format
6. Send the request

## CORS

CORS is enabled for all origins. To restrict origins in production, modify `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

## Database (Optional)

The backend includes MongoDB integration but works without it. To use MongoDB:

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env` file
3. The database will store query history for analytics

## Future Enhancements

- [ ] Add user authentication
- [ ] Implement ML models for better predictions
- [ ] Add real-time weather API integration
- [ ] Add actual market price API integration
- [ ] Implement image-based pest detection
- [ ] Add SMS/WhatsApp notifications

## Contributing

Feel free to contribute to this project by:
1. Forking the repository
2. Creating a feature branch
3. Making your changes
4. Submitting a pull request

## License

ISC

## Contact

For questions or support, please contact the development team.

---

**Made with ❤️ for Indian Farmers | भारतीय शेतकऱ्यांसाठी प्रेमाने बनवले**
