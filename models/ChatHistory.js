import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  source: {
    type: String,
    default: 'ai'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for search queries
chatHistorySchema.index({ timestamp: -1 });
chatHistorySchema.index({ language: 1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
