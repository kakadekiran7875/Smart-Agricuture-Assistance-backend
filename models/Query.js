const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['crop', 'soil', 'weather', 'pest', 'fertilizer', 'market']
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'mr', 'hi']
  },
  requestData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userLocation: {
    type: String
  }
});

module.exports = mongoose.model('Query', querySchema);
