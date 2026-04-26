import mongoose from 'mongoose';

const expertRequestSchema = new mongoose.Schema({
  request_id: {
    type: String,
    required: true,
    unique: true
  },
  farmer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  crop_type: {
    type: String,
    required: true
  },
  issue_description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  expert_assigned: {
    expert_id: String,
    name: String,
    phone: String,
    specialization: String
  },
  timestamps: {
    created_at: {
      type: Date,
      default: Date.now
    },
    assigned_at: Date,
    completed_at: Date
  },
  notes: [String],
  follow_up_required: {
    type: Boolean,
    default: false
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
expertRequestSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const ExpertRequest = mongoose.model('ExpertRequest', expertRequestSchema);

export default ExpertRequest;
