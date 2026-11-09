import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      index: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    userType: {
      type: String,
      required: [true, 'User type is required'],
      enum: [
        'farmer',
        'agriculture_student',
        'agriculture_expert',
        'agriculture_business_owner',
        'other'
      ],
      default: 'farmer'
    },
    preferredLanguage: {
      type: String,
      required: [true, 'Preferred language is required'],
      default: 'mr'
    },

    // Location Information
    state: {
      type: String,
      required: [true, 'State is required'],
      default: 'Maharashtra',
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      default: 'Pune',
      trim: true
    },
    taluka: {
      type: String,
      required: [true, 'Taluka is required'],
      default: 'Not Specified',
      trim: true
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      default: 'Not Specified',
      trim: true
    },
    fullAddress: {
      type: String,
      required: [true, 'Full address is required'],
      default: 'Maharashtra, India',
      trim: true
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      default: '400001',
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    location: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    },

    // Agriculture Profile
    cropsCultivated: {
      type: [String],
      default: []
    },
    farmingLandAcres: {
      type: Number,
      default: null
    },
    soilType: {
      type: String,
      default: ''
    },
    irrigationType: {
      type: String,
      default: ''
    },
    farmingExperience: {
      type: String,
      default: ''
    },

    // Account & Status Information
    role: {
      type: String,
      enum: ['farmer', 'expert', 'admin'],
      default: 'farmer'
    },
    isMobileVerified: {
      type: Boolean,
      default: false
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profileImage: {
      type: String,
      default: ''
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Virtual alias: name -> fullName
userSchema.virtual('name')
  .get(function () {
    return this.fullName;
  })
  .set(function (val) {
    this.fullName = val;
  });

// Virtual alias: phone -> mobileNumber
userSchema.virtual('phone')
  .get(function () {
    return this.mobileNumber;
  })
  .set(function (val) {
    this.mobileNumber = val;
  });

// Virtual alias: password setter for hashing into passwordHash
userSchema.virtual('password')
  .set(function (val) {
    this._plainPassword = val;
  })
  .get(function () {
    return this.passwordHash;
  });

// Pre-validate hook: Hash plain password before schema validation runs
userSchema.pre('validate', async function () {
  if (this._plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this._plainPassword, salt);
    this._plainPassword = undefined;
  } else if (this.isModified('passwordHash') && this.passwordHash && !this.passwordHash.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

// Compare candidate password with passwordHash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe JSON serialization: remove passwordHash and internal fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  delete obj.passwordHash;
  delete obj.password;
  delete obj._plainPassword;
  return obj;
};

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

export default User;
