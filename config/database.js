import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    const isCloudDeploy = !!(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.PORT === '10000' || process.env.NODE_ENV === 'production');
    const dbIp = process.env.DATABASE_IP || 'localhost';
    const MONGODB_URI = rawMongoUri || `mongodb://${dbIp}:27017/Demo`;
    
    const safeLogUri = (uri) => (typeof uri === 'string' ? uri.replace(/:([^@/]+)@/, ':****@') : uri);
    console.log(`🔌 Attempting to connect to MongoDB at: ${safeLogUri(MONGODB_URI)}`);
    
    const isCloudMongo = MONGODB_URI.startsWith('mongodb+srv://') || MONGODB_URI.includes('.mongodb.net');
    const conn = await mongoose.connect(MONGODB_URI, {
      autoIndex: false,
      serverSelectionTimeoutMS: isCloudMongo ? 15000 : 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.log('⚠️  Running with mock/in-memory fallback data');
  }
};

export default connectDB;
