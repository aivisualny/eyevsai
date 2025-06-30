const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vote: {
    type: String,
    enum: ['ai', 'real'],
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one vote per user per content
voteSchema.index({ content: 1, user: 1 }, { unique: true });

// Index for performance
voteSchema.index({ content: 1 });
voteSchema.index({ user: 1 });
voteSchema.index({ isCorrect: 1 });

module.exports = mongoose.model('Vote', voteSchema); 