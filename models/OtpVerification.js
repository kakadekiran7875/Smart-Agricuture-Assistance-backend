import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['registration', 'login', 'verification', 'reset_password'],
      default: 'registration'
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'otp_verifications'
  }
);

// TTL index to automatically remove expired OTP records
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification = mongoose.models.OtpVerification || mongoose.model('OtpVerification', otpVerificationSchema, 'otp_verifications');

export default OtpVerification;

