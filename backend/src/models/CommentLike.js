const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

commentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('CommentLike', commentLikeSchema); 