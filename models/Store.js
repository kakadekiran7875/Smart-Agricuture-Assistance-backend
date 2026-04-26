import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['seeds', 'fertilizers', 'pesticides', 'equipment', 'organic', 'seeds_fertilizers', 'all']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true // [longitude, latitude]
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    full: {
      type: String,
      required: true
    }
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: String,
    website: String,
    whatsapp: String
  },
  products: [{
    type: String
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total_reviews: {
      type: Number,
      default: 0
    }
  },
  hours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location-based queries
storeSchema.index({ location: '2dsphere' });

// Update the updated_at timestamp before saving
storeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Store = mongoose.model('Store', storeSchema);

export default Store;
