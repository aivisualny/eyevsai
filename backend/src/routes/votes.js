const express = require('express');
const Joi = require('joi');
const Vote = require('../models/Vote');
const Content = require('../models/Content');
const User = require('../models/User');
const BadgeSystem = require('../utils/badgeSystem');
const { auth } = require('../middleware/auth');
const WrongVote = require('../models/WrongVote');

const router = express.Router();

// 투표 생성
router.post('/', auth, async (req, res) => {
  const voteSchema = Joi.object({
    contentId: Joi.string().required(),
    vote: Joi.string().valid('ai', 'real').required()
  });

  const { error } = voteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { contentId, vote } = req.body;

  try {
    // 이미 투표했는지 확인
    const existing = await Vote.findOne({ content: contentId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ error: '이미 투표하셨습니다.' });
    }

    // 콘텐츠 존재 확인
    const content = await Content.findById(contentId);
    if (!content || content.status !== 'approved' || !content.isActive) {
      return res.status(404).json({ error: '투표할 수 없는 콘텐츠입니다.' });
    }

    // 정답 여부 확인
    const isCorrect = vote === content.type;
    const pointsEarned = isCorrect ? 10 : 1; // 정답: 10점, 오답: 1점

    // 투표 저장
    const newVote = new Vote({
      content: contentId,
      user: req.user._id,
      vote,
      isCorrect,
      pointsEarned
    });
    await newVote.save();

    // 오답일 경우 WrongVote 로그 저장 (백그라운드)
    if (!isCorrect) {
      WrongVote.create({
        contentId,
        userId: req.user._id,
        wasReal: content.type === 'real',
      }).catch(() => {});
    }

    // 콘텐츠 투표수 증가
    content.votes[vote] += 1;
    content.totalVotes += 1;
    await content.save();

    // 사용자 통계 업데이트
    const user = await User.findById(req.user._id);
    user.totalVotes += 1;
    user.correctVotes += isCorrect ? 1 : 0;
    user.points += pointsEarned;
    user.lastVoteDate = new Date();

    // 연속 정답 추적
    if (isCorrect) {
      user.consecutiveCorrect += 1;
      if (user.consecutiveCorrect > user.maxConsecutiveCorrect) {
        user.maxConsecutiveCorrect = user.consecutiveCorrect;
      }
    } else {
      user.consecutiveCorrect = 0;
    }

    // 정답률 히스토리 업데이트 (일별)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingHistory = user.accuracyHistory.find(h => 
      h.date.getTime() === today.getTime()
    );

    if (existingHistory) {
      existingHistory.totalVotes += 1;
      existingHistory.correctVotes += isCorrect ? 1 : 0;
      existingHistory.accuracy = Math.round((existingHistory.correctVotes / existingHistory.totalVotes) * 100);
    } else {
      user.accuracyHistory.push({
        date: today,
        totalVotes: 1,
        correctVotes: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0
      });
    }

    await user.save();

    // 뱃지 확인 및 수여
    const newBadges = await BadgeSystem.checkAndAwardBadges(req.user._id);

    res.status(201).json({ 
      message: '투표 완료', 
      vote: newVote,
      isCorrect,
      pointsEarned,
      newBadges: newBadges.map(badge => ({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        pointsReward: badge.pointsReward
      }))
    });
  } catch (err) {
    console.error('투표 오류:', err);
    res.status(500).json({ error: '투표 처리 중 오류 발생' });
  }
});

// 내 투표 내역 조회 (정답/오답 필터링 추가)
router.get('/my', auth, async (req, res) => {
  try {
    const { isCorrect, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { user: req.user._id };
    if (isCorrect !== undefined) {
      query.isCorrect = isCorrect === 'true';
    }
    
    const votes = await Vote.find(query)
      .populate('content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Vote.countDocuments(query);
    
    res.json({ 
      votes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: '투표 내역 조회 실패' });
  }
});

// 내 투표 통계 조회
router.get('/my/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const votes = await Vote.find({ user: req.user._id });
    
    // 일별 정답률 (최근 7일)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayVotes = votes.filter(v => {
        const voteDate = new Date(v.createdAt);
        voteDate.setHours(0, 0, 0, 0);
        return voteDate.getTime() === date.getTime();
      });
      
      const correctVotes = dayVotes.filter(v => v.isCorrect).length;
      const accuracy = dayVotes.length > 0 ? Math.round((correctVotes / dayVotes.length) * 100) : 0;
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        totalVotes: dayVotes.length,
        correctVotes,
        accuracy
      });
    }
    
    res.json({
      totalVotes: user.totalVotes,
      correctVotes: user.correctVotes,
      accuracy: user.getAccuracy(),
      points: user.points,
      consecutiveCorrect: user.consecutiveCorrect,
      maxConsecutiveCorrect: user.maxConsecutiveCorrect,
      last7Days
    });
  } catch (err) {
    res.status(500).json({ error: '통계 조회 실패' });
  }
});

module.exports = router; 