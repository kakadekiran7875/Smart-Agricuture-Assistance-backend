import mongoose from 'mongoose';

const fertilizerRecommendationSchema = new mongoose.Schema({
  recommendation_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `FERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  crop: {
    type: String,
    required: true
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
    required: true
  },
  recommended_fertilizer: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  application_method: {
    type: String
  },
  timing: {
    type: String
  },
  nutrient_status: {
    nitrogen: String,
    phosphorus: String,
    potassium: String
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'mr', 'hi']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

fertilizerRecommendationSchema.index({ created_at: -1 });
fertilizerRecommendationSchema.index({ crop: 1 });

const FertilizerRecommendation = mongoose.model('FertilizerRecommendation', fertilizerRecommendationSchema);

export default FertilizerRecommendation;
