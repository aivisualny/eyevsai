const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  points: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  correctVotes: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 소셜 로그인 관련 필드
  socialProvider: {
    type: String,
    enum: ['google', 'facebook', 'kakao', null],
    default: null
  },
  socialId: {
    type: String,
    default: null
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  badges: [{
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  accuracyHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    accuracy: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    correctVotes: {
      type: Number,
      default: 0
    }
  }],
  consecutiveCorrect: {
    type: Number,
    default: 0
  },
  maxConsecutiveCorrect: {
    type: Number,
    default: 0
  },
  lastVoteDate: {
    type: Date,
    default: null
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate accuracy
userSchema.methods.getAccuracy = function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.correctVotes / this.totalVotes) * 100);
};

module.exports = mongoose.model('User', userSchema); 