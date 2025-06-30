const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 팔로우
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user._id;
    if (userId.toString() === targetId) return res.status(400).json({ error: '자기 자신은 팔로우할 수 없습니다.' });
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });
    if (user.following.includes(targetId)) return res.status(400).json({ error: '이미 팔로우 중입니다.' });
    user.following.push(targetId);
    target.followers.push(userId);
    await user.save();
    await target.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '팔로우 처리 중 오류' });
  }
});

// 언팔로우
router.delete('/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user._id;
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });
    user.following = user.following.filter(id => id.toString() !== targetId);
    target.followers = target.followers.filter(id => id.toString() !== userId.toString());
    await user.save();
    await target.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '언팔로우 처리 중 오류' });
  }
});

// 팔로워 목록
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'username');
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json({ followers: user.followers });
  } catch (err) {
    res.status(500).json({ error: '팔로워 목록 조회 오류' });
  }
});

// 팔로잉 목록
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'username');
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json({ following: user.following });
  } catch (err) {
    res.status(500).json({ error: '팔로잉 목록 조회 오류' });
  }
});

module.exports = router; 