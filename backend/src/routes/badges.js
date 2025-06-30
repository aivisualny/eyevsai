const express = require('express');
const Badge = require('../models/Badge');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 모든 뱃지 조회
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ category: 1, condition: { value: 1 } });
    res.json({ badges });
  } catch (err) {
    res.status(500).json({ error: '뱃지 조회 실패' });
  }
});

// 내 뱃지 조회
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('badges.badge');
    const earnedBadges = user.badges.map(b => ({
      ...b.badge.toObject(),
      earnedAt: b.earnedAt
    }));
    
    res.json({ badges: earnedBadges });
  } catch (err) {
    res.status(500).json({ error: '내 뱃지 조회 실패' });
  }
});

// 뱃지 상세 정보 조회
router.get('/:id', async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({ error: '뱃지를 찾을 수 없습니다.' });
    }
    
    res.json({ badge });
  } catch (err) {
    res.status(500).json({ error: '뱃지 조회 실패' });
  }
});

// 뱃지 획득 조건 확인 (개발용)
router.get('/check/:badgeId', auth, async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.badgeId);
    if (!badge) {
      return res.status(404).json({ error: '뱃지를 찾을 수 없습니다.' });
    }
    
    const user = await User.findById(req.user._id);
    const BadgeSystem = require('../utils/badgeSystem');
    const isEligible = await BadgeSystem.checkBadgeCondition(user, badge);
    
    res.json({ 
      badge,
      isEligible,
      userStats: {
        totalVotes: user.totalVotes,
        correctVotes: user.correctVotes,
        accuracy: user.getAccuracy(),
        consecutiveCorrect: user.maxConsecutiveCorrect,
        points: user.points
      }
    });
  } catch (err) {
    res.status(500).json({ error: '뱃지 조건 확인 실패' });
  }
});

module.exports = router; 