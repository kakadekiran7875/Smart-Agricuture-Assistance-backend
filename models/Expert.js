import mongoose from 'mongoose';

const expertSchema = new mongoose.Schema({
  expert_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  specialization: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['agronomist', 'pathologist', 'entomologist', 'horticulturist', 'soil_scientist', 'irrigation_expert']
  },
  experience: {
    type: String
  },
  experience_years: Number,
  location: {
    city: String,
    state: String,
    full: String
  },
  contact: {
    phone: String,
    email: String,
    whatsapp: String
  },
  languages: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  total_consultations: {
    type: Number,
    default: 0
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    working_hours: {
      start: String,
      end: String
    }
  },
  consultation_fee: {
    phone: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    visit: { type: Number, default: 0 }
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

// Update the updated_at timestamp before saving
expertSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Expert = mongoose.model('Expert', expertSchema);

export default Expert;
