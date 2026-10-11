import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import cropRoutes from "./routes/cropRoutes.js";
import fertilizerRoutes from "./routes/fertilizerRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import pestRoutes from "./routes/pestRoutes.js";
import soilRoutes from "./routes/soilRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import diseaseRoutes from "./routes/diseaseRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import expertRoutes from "./routes/expertRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import expertRequestRoutes from "./routes/expertRequestRoutes.js";
import systemConfigRoutes from "./routes/systemConfigRoutes.js";

const app = express();

// CORS Configuration - Allow frontend and all local network origins
const allowedOrigins = [
  `http://${process.env.FRONTEND_IP || 'localhost'}:3000`,
  `http://${process.env.FRONTEND_IP || 'localhost'}:5173`,
  `http://${process.env.FRONTEND_IP || 'localhost'}:8080`,
  `http://${process.env.BACKEND_IP || 'localhost'}:5001`,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.DEBUG === 'true') {
      return callback(null, true);
    }
    // In production, you might want to block unknown origins
    // For now, allow all in development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Serve uploaded images securely
app.use('/uploads', express.static('uploads'));

// 🔗 MongoDB Connection Configuration
const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
const isCloudDeploy = !!(
  process.env.RENDER ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.RENDER_SERVICE_ID ||
  process.env.PORT === '10000' ||
  process.env.NODE_ENV === 'production'
);

const isLocalhostUri = !rawMongoUri ||
  rawMongoUri.includes('localhost') ||
  rawMongoUri.includes('127.0.0.1') ||
  rawMongoUri.includes('::1');

const MONGO_URI = rawMongoUri ||
  (process.env.DATABASE_IP ? `mongodb://${process.env.DATABASE_IP}:27017/Demo` : "mongodb://localhost:27017/Demo");

// Helper to safely mask credentials in logs
const safeLogUri = (uri) => (typeof uri === 'string' ? uri.replace(/:([^@/]+)@/, ':****@') : uri);

// Configure Mongoose options
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);
mongoose.set('strictQuery', false);

if (isCloudDeploy && isLocalhostUri) {
  console.log("☁️  Cloud deployment detected (Render) without a remote MongoDB URI.");
  console.log("💡 To connect a persistent database on Render:");
  console.log("   1. Create a free cluster on MongoDB Atlas (https://cloud.mongodb.com)");
  console.log("   2. In Render Dashboard -> Environment, set MONGODB_URI to your Atlas connection string:");
  console.log("      MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/Demo?retryWrites=true&w=majority");
  console.log("   3. In MongoDB Atlas Network Access, add IP: 0.0.0.0/0 (Allow access from anywhere)");
  console.log("🛡️  Operating in fault-tolerant mode: All API endpoints are active with in-memory fallback data.");
} else {
  const isCloudMongo = MONGO_URI.startsWith('mongodb+srv://') || MONGO_URI.includes('.mongodb.net');
  console.log(`🔌 Connecting to MongoDB: ${safeLogUri(MONGO_URI)}`);

  mongoose
    .connect(MONGO_URI, {
      autoIndex: false, // Disable automatic index building in production
      serverSelectionTimeoutMS: isCloudMongo ? 15000 : 5000,
      socketTimeoutMS: 45000,
    })
    .then(async (conn) => {
      console.log(`✅ MongoDB connected successfully`);
      console.log(`📊 Database: ${conn.connection.name || 'Demo'}`);
      console.log(`🌐 Host: ${conn.connection.host}`);
      // Ensure 2dsphere geospatial index exists for nearby store queries
      try {
        await conn.connection.db.collection('stores').createIndex({ location: '2dsphere' });
        console.log(`📍 Geospatial 2dsphere index ready on stores`);
      } catch (idxErr) {
        console.log(`ℹ️  Index setup note: ${idxErr.message}`);
      }
    })
    .catch((err) => {
      console.log("⚠️  MongoDB not connected - Running without database");
      console.log("💡 API endpoints will work with mock and in-memory data");
      console.log(`❌ Error: ${err.message}`);
      if (isCloudMongo) {
        console.log("💡 Atlas Tip: Make sure your IP address (0.0.0.0/0) is whitelisted in MongoDB Atlas Network Access.");
      }
    });

  // Handle connection errors after initial connection
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });
}

// 🏥 Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime()
  });
});

// 🏠 Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "🌾 Smart Agriculture Assistant API",
    status: "running",
    version: "1.0.0",
    backendUrl: `http://${process.env.BACKEND_IP || 'localhost'}:${process.env.PORT || 5001}`,
    frontendUrl: `http://${process.env.FRONTEND_IP || 'localhost'}:3000`,
    endpoints: {
      health: "/health (GET)",
      soil: "/api/soil/analyze (POST)",
      fertilizer: "/api/fertilizer/recommend (POST)",
      pest: "/api/pest/detect (POST)",
      market: "/api/market/prices (GET)",
      marketDetailed: "/api/market/market-prices (GET)",
      weather: "/api/weather/:location (GET)",
      weatherDetailed: "/api/weather/ (GET)",
      aiChat: "/api/ai/chat (POST)",
      aiStatus: "/api/ai/status (GET)",
      diseaseDetect: "/detect (POST - with image)",
      diseaseInfo: "/detect/info/:diseaseName (GET)",
      diseaseList: "/detect/list (GET)",
      chatbot: "/api/chatbot/chat (POST)",
      chatbotAdvice: "/api/chatbot/advice (POST)",
      chatbotTips: "/api/chatbot/tips (GET)",
      expertList: "/api/expert/list (GET)",
      expertDetails: "/api/expert/:id (GET)",
      expertContact: "/api/expert/contact (POST)",
      expertBooking: "/api/expert/book-consultation (POST)",
      expertAvailability: "/api/expert/:id/availability (GET)",
      storesNearby: "/api/stores/nearby (POST)",
      storeDetails: "/api/stores/:id (GET)",
      storeCategories: "/api/stores/categories/list (GET)",
      storesInitData: "/api/stores/init-sample-data (POST)",
      expertRequestSubmit: "/api/expert/request (POST)",
      expertRequestStatus: "/api/expert/request/:requestId (GET)",
      expertRequestCancel: "/api/expert/request/:requestId/cancel (POST)",
      expertRequestsAll: "/api/expert/requests/all (GET)",
      expertInitData: "/api/expert/init-experts (POST)",
      systemConfigInit: "/api/system/init-config (POST)",
      systemConfigGet: "/api/system/config (GET)",
      systemConfigUpdate: "/api/system/update-config (PUT)"
    },
    documentation: "See API_REFERENCE.md for details"
  });
});

// 🌾 All API routes
app.use("/api/crop", cropRoutes);
app.use("/api/crops", cropRoutes);           // Frontend alias
app.use("/api/fertilizer", fertilizerRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/pest", pestRoutes);
app.use("/api/soil", soilRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/detect", diseaseRoutes);
app.use("/api/detect", diseaseRoutes);       // Frontend alias
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/expert", expertRequestRoutes); // Handles /api/expert/request, /api/expert/requests/all
app.use("/api/expert", expertRoutes);        // Handles /api/expert/list, /api/expert/:id, etc.
app.use("/api/stores", storeRoutes);
app.use("/api/expert-request", expertRequestRoutes);
app.use("/api/system", systemConfigRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: "/api/..."
  });
});

// 🚀 Start server with error handling
const PORT = process.env.PORT || 5001;
const HOST = process.env.API_HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const isRender = !!(process.env.RENDER || process.env.RENDER_EXTERNAL_URL);
  const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://${process.env.BACKEND_IP || 'localhost'}:${PORT}`;
  const localUrl = `http://localhost:${PORT}`;

  console.log(`✅ Server running on port ${PORT}`);
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`🌐 Live Production URL: ${process.env.RENDER_EXTERNAL_URL}`);
    console.log(`🔗 Connect frontend to: ${process.env.RENDER_EXTERNAL_URL}`);
  } else {
    console.log(`🌐 Backend URL: ${publicUrl}`);
    console.log(`🖥️  Local URL:   ${localUrl}`);
    console.log(`🔗 Connect frontend to: ${publicUrl}`);
  }

  if (isCloudDeploy && isLocalFallback) {
    console.log(`💡 MongoDB Status: Operating in fallback mock mode. Set MONGODB_URI on Render for live DB.`);
  } else if (!isCloudDeploy) {
    console.log(`💡 Local MongoDB: Ensure mongod is active on ${process.env.DATABASE_IP || 'localhost'}:27017`);
  }
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log(`\n💡 Solutions:`);
    console.log(`   1. Run kill-port.bat to free the port`);
    console.log(`   2. Or change PORT in .env file`);
    console.log(`   3. Or run: netstat -ano | findstr :${PORT}`);
    console.log(`      Then: taskkill /F /PID <PID_NUMBER>\n`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Server initialized

