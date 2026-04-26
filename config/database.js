import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use environment variable or fallback to correct database IP
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb:// 10.26.83.239:27017/smartAgri';
    
    console.log(`🔌 Attempting to connect to MongoDB at: ${MONGODB_URI}`);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Database IP:  10.26.83.239`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.log('⚠️  Running without database connection');
    console.log('💡 Make sure MongoDB is running on  10.26.83.239:27017');
    // Don't exit process in development
  }
};

export default connectDB;
