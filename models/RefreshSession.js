import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    revokedAt: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    replacedByTokenHash: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'refresh_sessions'
  }
);

// TTL index to automatically clean up expired sessions from MongoDB
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshSession = mongoose.models.RefreshSession || mongoose.model('RefreshSession', refreshSessionSchema, 'refresh_sessions');

export default RefreshSession;
