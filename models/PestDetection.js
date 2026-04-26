import mongoose from 'mongoose';

const pestDetectionSchema = new mongoose.Schema({
  detection_id: {
    type: String,
    required: true,
    unique: true
  },
  crop: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  detected_pest: {
    name: String,
    scientific_name: String,
    severity: String,
    description: String
  },
  treatment_provided: [String],
  prevention_provided: [String],
  detection_success: {
    type: Boolean,
    default: false
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

// Index for analytics
pestDetectionSchema.index({ created_at: -1 });
pestDetectionSchema.index({ crop: 1 });
pestDetectionSchema.index({ detection_success: 1 });

const PestDetection = mongoose.model('PestDetection', pestDetectionSchema);

export default PestDetection;
