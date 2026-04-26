import mongoose from 'mongoose';

const soilAnalysisSchema = new mongoose.Schema({
  analysis_id: {
    type: String,
    required: true,
    unique: true
  },
  ph: {
    type: Number,
    required: true,
    min: 0,
    max: 14
  },
  organic_carbon: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  soil_quality: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    required: true
  },
  ph_classification: {
    classification: String,
    soil_type: String,
    recommendation: String
  },
  carbon_classification: {
    classification: String,
    soil_health: String,
    recommendation: String
  },
  overall_recommendation: String,
  user_info: {
    ip_address: String,
    user_agent: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for analytics
soilAnalysisSchema.index({ created_at: -1 });
soilAnalysisSchema.index({ soil_quality: 1 });

const SoilAnalysis = mongoose.model('SoilAnalysis', soilAnalysisSchema);

export default SoilAnalysis;
