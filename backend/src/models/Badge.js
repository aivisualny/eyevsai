const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['accuracy', 'participation', 'achievement', 'special'],
    required: true
  },
  condition: {
    type: {
      type: String,
      enum: ['totalVotes', 'correctVotes', 'accuracy', 'consecutiveCorrect', 'uploadCount', 'points'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    operator: {
      type: String,
      enum: ['gte', 'lte', 'eq'],
      default: 'gte'
    }
  },
  pointsReward: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Badge', badgeSchema); 