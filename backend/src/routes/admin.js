const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Content = require('../models/Content');
const User = require('../models/User');
const Vote = require('../models/Vote');

const router = express.Router();

// 콘텐츠 정답 공개 및 포인트 지급
router.patch('/content/:id/reveal', adminAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    if (content.isAnswerRevealed) {
      return res.status(400).json({ error: '이미 정답이 공개된 콘텐츠입니다.' });
    }
    content.isAnswerRevealed = true;
    content.revealDate = new Date();
    await content.save();

    // 정답 맞춘 유저에게 포인트 지급
    const correctVotes = await Vote.find({
      content: content._id,
      vote: content.isAI ? 'ai' : 'real',
      isCorrect: { $ne: true } // 이미 포인트 지급된 투표는 제외
    });
    let rewarded = 0;
    for (const vote of correctVotes) {
      vote.isCorrect = true;
      vote.pointsEarned = 10;
      await vote.save();
      await User.findByIdAndUpdate(vote.user, {
        $inc: { points: 10, correctVotes: 1, totalVotes: 1 }
      });
      rewarded++;
    }
    // 오답 유저의 totalVotes만 증가
    const wrongVotes = await Vote.find({
      content: content._id,
      vote: content.isAI ? 'real' : 'ai',
      isCorrect: { $ne: false }
    });
    for (const vote of wrongVotes) {
      vote.isCorrect = false;
      vote.pointsEarned = 0;
      await vote.save();
      await User.findByIdAndUpdate(vote.user, {
        $inc: { totalVotes: 1 }
      });
    }
    res.json({ message: `정답이 공개되었습니다. (${rewarded}명 포인트 지급)`, content });
  } catch (err) {
    console.error('정답 공개/포인트 지급 오류:', err);
    res.status(500).json({ error: '정답 공개/포인트 지급 실패' });
  }
});

// 유저 포인트 수동 조정 (예시)
router.patch('/user/:id/points', adminAuth, async (req, res) => {
  const { points } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { points },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: '포인트가 수정되었습니다.', user });
  } catch (err) {
    res.status(500).json({ error: '포인트 수정 실패' });
  }
});

// 정답률 랭킹 (상위 10명)
router.get('/ranking', async (req, res) => {
  try {
    const users = await User.find({ totalVotes: { $gt: 0 } })
      .select('username points totalVotes correctVotes avatar')
      .lean();
    const ranked = users
      .map(u => ({
        ...u,
        accuracy: u.totalVotes > 0 ? Math.round((u.correctVotes / u.totalVotes) * 100) : 0
      }))
      .sort((a, b) => b.accuracy - a.accuracy || b.points - a.points)
      .slice(0, 10);
    res.json({ ranking: ranked });
  } catch (err) {
    res.status(500).json({ error: '랭킹 조회 실패' });
  }
});

module.exports = router; 