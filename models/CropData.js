import mongoose from 'mongoose';

const cropDataSchema = new mongoose.Schema({
  crop_id: {
    type: String,
    default: () => `CROP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  nitrogen: {
    type: Number,
    required: true
  },
  phosphorus: {
    type: Number,
    required: true
  },
  potassium: {
    type: Number,
    default: null
  },
  ph: {
    type: Number,
    default: null
  },
  temperature: {
    type: Number,
    default: null
  },
  humidity: {
    type: Number,
    default: null
  },
  rainfall: {
    type: Number,
    default: null
  },
  recommendedCrop: {
    type: String,
    required: true
  },
  confidence: {
    type: String,
    default: 'high'
  },
  alternativeCrops: [{
    type: String
  }],
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'mr', 'hi']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for analytics and fast retrieval
cropDataSchema.index({ timestamp: -1 });
cropDataSchema.index({ recommendedCrop: 1 });

const CropData = mongoose.model('CropData', cropDataSchema);

export default CropData;
