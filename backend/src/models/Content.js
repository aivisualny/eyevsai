const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  category: {
    type: String,
    enum: ['art', 'photography', 'video', 'text', 'other'],
    default: 'other'
  },
  isAI: {
    type: Boolean,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  votes: {
    ai: { type: Number, default: 0 },
    real: { type: Number, default: 0 }
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  isAnswerRevealed: {
    type: Boolean,
    default: false
  },
  revealDate: {
    type: Date,
    default: null
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 10 && tags.every(tag => tag.length <= 20);
      },
      message: 'Tags must be at most 10 items and each tag must be at most 20 characters'
    },
    default: []
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRecycled: {
    type: Boolean,
    default: false
  },
  isRequestedReview: {
    type: Boolean,
    default: false
  },
  recycleAt: {
    type: Date,
    default: null
  },
  recycleCount: {
    type: Number,
    default: 0
  },
  predictedDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  predictedAccuracy: {
    type: Number,
    default: null
  },
  aiDetectionResult: {
    type: String,
    enum: ['REAL', 'FAKE', null],
    default: null
  },
  aiConfidence: {
    type: Number,
    default: null
  },
  detectionModel: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  strict: false // 디버깅을 위해 임시로 false로 설정
});

// Index for better query performance
contentSchema.index({ status: 1, isActive: 1 });
contentSchema.index({ category: 1, status: 1 });
contentSchema.index({ uploadedBy: 1 });

// Calculate AI percentage
contentSchema.methods.getAIPercentage = function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votes.ai / this.totalVotes) * 100);
};

// Calculate real percentage
contentSchema.methods.getRealPercentage = function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votes.real / this.totalVotes) * 100);
};

module.exports = mongoose.model('Content', contentSchema); 