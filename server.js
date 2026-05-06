import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from config.env
dotenv.config({ path: './config.env' });

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

// Serve static files (HTML, CSS, JS)
app.use(express.static('.'));

// 🔗 MongoDB Connection - Local Database Server
const MONGO_URI = process.env.MONGODB_URI ||
  (process.env.DATABASE_IP ? `mongodb://${process.env.DATABASE_IP}:27017/smartAgri` : "mongodb://localhost:27017/smartAgri");
console.log(`🔌 Connecting to MongoDB: ${MONGO_URI}`);

// Set mongoose to not buffer commands when disconnected
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0); // No buffering at all
mongoose.set('strictQuery', false);

mongoose
  .connect(MONGO_URI, {
    autoIndex: false, // Disable automatic index building
    serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log(`📍 Database: ${MONGO_URI}`);
    console.log(`🌐 Database IP: ${process.env.DATABASE_IP || '10.232.236.239'}`);
  })
  .catch((err) => {
    console.log("⚠️  MongoDB not connected - Running without database");
    console.log("💡 API endpoints will work with mock data");
    console.log(`❌ Error: ${err.message}`);
  });

// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

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
app.use("/api/fertilizer", fertilizerRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/pest", pestRoutes);
app.use("/api/soil", soilRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/detect", diseaseRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/expert", expertRoutes);
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
  const backendUrl = `http://${process.env.BACKEND_IP || 'localhost'}:${PORT}`;
  const localUrl = `http://localhost:${PORT}`;
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Backend URL: ${backendUrl}`);
  console.log(`🖥️  Local URL:   ${localUrl}`);
  console.log(`� Connect frontend to: ${backendUrl}`);
  console.log(`⚠️  Make sure MongoDB is running on ${process.env.DATABASE_IP || 'localhost'}`);
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
