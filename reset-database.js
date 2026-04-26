// Drop and recreate the smartAgri database to clear locks
import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017";
const dbName = "smartAgri";

console.log('🗑️  Dropping smartAgri database to clear locks...\n');

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

async function resetDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        // Drop the database
        await client.db(dbName).dropDatabase();
        console.log('✅ Database dropped successfully\n');

        console.log('💡 Now run: node init-db-native.js');
        console.log('   to recreate the database with fresh data\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

resetDatabase().then(() => process.exit(0));
