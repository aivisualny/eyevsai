const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: true,
    maxlength: 300
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  },
  vote: {
    type: String,
    enum: ['agree', 'disagree', 'none'],
    default: 'none'
  }
});

module.exports = mongoose.model('Comment', commentSchema); 