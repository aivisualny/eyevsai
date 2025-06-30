const express = require('express');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 댓글 좋아요 추가
router.post('/:id/like', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    // 이미 좋아요 했는지 확인
    const exists = await CommentLike.findOne({ user: userId, comment: commentId });
    if (exists) return res.status(400).json({ error: '이미 좋아요를 눌렀습니다.' });
    await CommentLike.create({ user: userId, comment: commentId });
    await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '좋아요 처리 중 오류' });
  }
});

// 댓글 좋아요 취소
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    const like = await CommentLike.findOneAndDelete({ user: userId, comment: commentId });
    if (like) {
      await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '좋아요 취소 중 오류' });
  }
});

// 댓글 좋아요 수/목록 조회
router.get('/:id/likes', async (req, res) => {
  try {
    const commentId = req.params.id;
    const likes = await CommentLike.find({ comment: commentId }).populate('user', 'username');
    res.json({ count: likes.length, users: likes.map(l => l.user) });
  } catch (err) {
    res.status(500).json({ error: '좋아요 목록 조회 오류' });
  }
});

module.exports = router; 