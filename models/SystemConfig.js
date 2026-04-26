import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  config_id: {
    type: String,
    required: true,
    unique: true,
    default: 'system_config_v1'
  },
  backend_ip: {
    type: String,
    required: true
  },
  frontend_ip: {
    type: String,
    required: true
  },
  database_ip: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  mongodb_uri: {
    type: String,
    required: true
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
systemConfigSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
