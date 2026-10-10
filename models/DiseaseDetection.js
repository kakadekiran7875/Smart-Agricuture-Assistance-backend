import mongoose from 'mongoose';

const diseaseDetectionSchema = new mongoose.Schema({
  detection_id: {
    type: String,
    required: true,
    unique: true
  },
  disease_name: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  treatment: {
    type: mongoose.Schema.Types.Mixed
  },
  recommendation: {
    type: String
  },
  prevention: {
    type: String
  },
  preventive_measures: {
    type: String
  },
  image_name: {
    type: String
  },
  image_path: {
    type: String
  },
  image_url: {
    type: String
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'mr', 'hi', 'kn']
  },
  analysis_method: {
    type: String,
    enum: ['plant_id_api', 'hash_based_fallback', 'hash_based_no_api_key', 'manual'],
    default: 'hash_based_fallback'
  },
  user_info: {
    ip_address: String,
    user_agent: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast querying
diseaseDetectionSchema.index({ created_at: -1 });
diseaseDetectionSchema.index({ disease_name: 1 });

const DiseaseDetection = mongoose.model('DiseaseDetection', diseaseDetectionSchema);

export default DiseaseDetection;
