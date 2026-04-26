// Initialize database using NATIVE MongoDB driver (bypassing Mongoose)
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.DATABASE_IP ? `mongodb://${process.env.DATABASE_IP}:27017` : (process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017");
const DB_NAME = "smartAgri";

console.log('🔌 Connecting to MongoDB (Native Driver)...');
console.log(`📍 URI: ${MONGO_URI}/${DB_NAME}\n`);

const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
});

async function initializeDatabase() {
    try {
        await client.connect();
        console.log('✅ MongoDB connected successfully\n');

        const db = client.db(DB_NAME);

        // Initialize Experts
        console.log('👨‍🌾 Initializing Experts...');
        const expertsCollection = db.collection('experts');
        const expertCount = await expertsCollection.countDocuments();

        if (expertCount === 0) {
            const sampleExperts = [
                {
                    expert_id: "EXP001",
                    name: "Dr. Suresh Patil",
                    phone: "+91 9876500000",
                    email: "suresh.patil@agriexpert.com",
                    specialization: ["Crop Diseases", "Pest Control"],
                    category: "pathologist",
                    experience: "15 years",
                    experience_years: 15,
                    languages: ["en", "hi", "kn", "mr"],
                    rating: 4.8,
                    total_consultations: 1250,
                    availability: {
                        status: "available",
                        working_hours: { start: "09:00", end: "18:00" }
                    },
                    location: {
                        city: "Bangalore",
                        state: "Karnataka",
                        full: "Bangalore, Karnataka"
                    },
                    contact: {
                        phone: "+91 9876500000",
                        email: "suresh.patil@agriexpert.com"
                    },
                    consultation_fee: {
                        phone: 200,
                        video: 500,
                        visit: 1000
                    },
                    verified: true,
                    active: true
                },
                {
                    expert_id: "EXP002",
                    name: "Dr. Priya Sharma",
                    phone: "+91 9876500001",
                    email: "priya.sharma@agriexpert.com",
                    specialization: ["Organic Farming", "Soil Health"],
                    category: "agronomist",
                    experience: "12 years",
                    experience_years: 12,
                    languages: ["en", "hi", "mr"],
                    rating: 4.9,
                    total_consultations: 980,
                    availability: {
                        status: "available",
                        working_hours: { start: "10:00", end: "19:00" }
                    },
                    location: {
                        city: "Pune",
                        state: "Maharashtra",
                        full: "Pune, Maharashtra"
                    },
                    contact: {
                        phone: "+91 9876500001",
                        email: "priya.sharma@agriexpert.com"
                    },
                    consultation_fee: {
                        phone: 200,
                        video: 500,
                        visit: 1000
                    },
                    verified: true,
                    active: true
                },
                {
                    expert_id: "EXP003",
                    name: "Dr. Arun Reddy",
                    phone: "+91 9876500002",
                    email: "arun.reddy@agriexpert.com",
                    specialization: ["Irrigation", "Water Management"],
                    category: "irrigation_expert",
                    experience: "10 years",
                    experience_years: 10,
                    languages: ["en", "hi", "te"],
                    rating: 4.7,
                    total_consultations: 750,
                    availability: {
                        status: "available",
                        working_hours: { start: "09:00", end: "17:00" }
                    },
                    location: {
                        city: "Hyderabad",
                        state: "Telangana",
                        full: "Hyderabad, Telangana"
                    },
                    contact: {
                        phone: "+91 9876500002",
                        email: "arun.reddy@agriexpert.com"
                    },
                    consultation_fee: {
                        phone: 200,
                        video: 500,
                        visit: 1000
                    },
                    verified: true,
                    active: true
                },
                {
                    expert_id: "EXP004",
                    name: "Dr. Meena Kulkarni",
                    phone: "+91 9876500003",
                    email: "meena.kulkarni@agriexpert.com",
                    specialization: ["Pest Control & IPM", "Integrated Pest Management"],
                    category: "entomologist",
                    experience: "14 years",
                    experience_years: 14,
                    languages: ["en", "hi", "mr", "kn"],
                    rating: 4.8,
                    total_consultations: 1100,
                    availability: {
                        status: "available",
                        working_hours: { start: "08:00", end: "18:00" }
                    },
                    location: {
                        city: "Mumbai",
                        state: "Maharashtra",
                        full: "Mumbai, Maharashtra"
                    },
                    contact: {
                        phone: "+91 9876500003",
                        email: "meena.kulkarni@agriexpert.com"
                    },
                    consultation_fee: {
                        phone: 250,
                        video: 600,
                        visit: 1200
                    },
                    verified: true,
                    active: true
                },
                {
                    expert_id: "EXP005",
                    name: "Dr. Rajesh Nair",
                    phone: "+91 9876500004",
                    email: "rajesh.nair@agriexpert.com",
                    specialization: ["Fruit & Vegetable Cultivation", "Horticulture"],
                    category: "horticulturist",
                    experience: "16 years",
                    experience_years: 16,
                    languages: ["en", "hi", "ml"],
                    rating: 4.9,
                    total_consultations: 1350,
                    availability: {
                        status: "available",
                        working_hours: { start: "09:00", end: "17:00" }
                    },
                    location: {
                        city: "Kochi",
                        state: "Kerala",
                        full: "Kochi, Kerala"
                    },
                    contact: {
                        phone: "+91 9876500004",
                        email: "rajesh.nair@agriexpert.com"
                    },
                    consultation_fee: {
                        phone: 300,
                        video: 700,
                        visit: 1500
                    },
                    verified: true,
                    active: true
                }
            ];

            await expertsCollection.insertMany(sampleExperts);
            console.log(`✅ Inserted ${sampleExperts.length} experts`);
        } else {
            console.log(`ℹ️  Database already has ${expertCount} experts`);
        }

        // Initialize Stores
        console.log('\n🏪 Initializing Stores...');
        const storesCollection = db.collection('stores');
        const storeCount = await storesCollection.countDocuments();

        if (storeCount === 0) {
            const sampleStores = [
                {
                    store_id: "STORE001",
                    name: "Krishi Kendra Seeds & Fertilizers",
                    type: "seeds_fertilizers",
                    location: {
                        type: "Point",
                        coordinates: [77.5980, 12.9750]
                    },
                    address: {
                        street: "MG Road",
                        city: "Bangalore",
                        state: "Karnataka",
                        pincode: "560001",
                        full: "MG Road, Bangalore, Karnataka 560001"
                    },
                    contact: {
                        phone: "+91 9876543210",
                        email: "info@krishikendra.com",
                        website: "www.krishikendra.com"
                    },
                    products: ["Seeds", "Fertilizers", "Pesticides", "Farm Tools"],
                    rating: {
                        average: 4.5,
                        total_reviews: 120
                    },
                    hours: {
                        monday: "9:00 AM - 7:00 PM",
                        tuesday: "9:00 AM - 7:00 PM",
                        wednesday: "9:00 AM - 7:00 PM",
                        thursday: "9:00 AM - 7:00 PM",
                        friday: "9:00 AM - 7:00 PM",
                        saturday: "9:00 AM - 5:00 PM",
                        sunday: "Closed"
                    },
                    verified: true,
                    active: true
                },
                {
                    store_id: "STORE002",
                    name: "Green Valley Organic Store",
                    type: "organic",
                    location: {
                        type: "Point",
                        coordinates: [77.5833, 12.9250]
                    },
                    address: {
                        street: "4th Block",
                        city: "Bangalore",
                        state: "Karnataka",
                        pincode: "560011",
                        full: "Jayanagar 4th Block, Bangalore 560011"
                    },
                    contact: {
                        phone: "+91 9876543211",
                        email: "contact@greenvalley.com"
                    },
                    products: ["Organic Seeds", "Bio-Fertilizers", "Compost", "Organic Pesticides"],
                    rating: {
                        average: 4.8,
                        total_reviews: 95
                    },
                    hours: {
                        monday: "8:00 AM - 8:00 PM",
                        tuesday: "8:00 AM - 8:00 PM",
                        wednesday: "8:00 AM - 8:00 PM",
                        thursday: "8:00 AM - 8:00 PM",
                        friday: "8:00 AM - 8:00 PM",
                        saturday: "8:00 AM - 6:00 PM",
                        sunday: "10:00 AM - 4:00 PM"
                    },
                    verified: true,
                    active: true
                }
            ];

            await storesCollection.insertMany(sampleStores);
            console.log(`✅ Inserted ${sampleStores.length} stores`);
        } else {
            console.log(`ℹ️  Database already has ${storeCount} stores`);
        }

        console.log('\n✅ Database initialization complete!');
        console.log('\n📊 Summary:');
        console.log(`   - Experts: ${await expertsCollection.countDocuments()}`);
        console.log(`   - Stores: ${await storesCollection.countDocuments()}`);
        console.log(`   - Expert Requests: ${await db.collection('expertrequests').countDocuments()}`);
        console.log(`   - Soil Analyses: ${await db.collection('soilanalyses').countDocuments()}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

initializeDatabase();
