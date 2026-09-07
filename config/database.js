import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use environment variable or fallback to localhost
    const dbIp = process.env.DATABASE_IP || 'localhost';
    const MONGODB_URI = process.env.MONGODB_URI || `mongodb://${dbIp}:27017/Demo`;
    
    console.log(`🔌 Attempting to connect to MongoDB at: ${MONGODB_URI}`);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Database IP: ${dbIp}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.log('⚠️  Running without database connection');
    console.log(`💡 Make sure MongoDB is running on ${process.env.DATABASE_IP || 'localhost'}:27017`);
    // Don't exit process in development
  }
};

export default connectDB;
