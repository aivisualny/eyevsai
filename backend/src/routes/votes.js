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
    console.log('투표 요청:', { contentId, vote, userId: req.user._id });
    
    // 이미 투표했는지 확인
    const existing = await Vote.findOne({ content: contentId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ error: '이미 투표하셨습니다.' });
    }

    // 콘텐츠 존재 확인
    const content = await Content.findById(contentId);
    console.log('콘텐츠 정보:', { 
      id: content?._id, 
      title: content?.title, 
      status: content?.status, 
      isActive: content?.isActive,
      isAI: content?.isAI,
      isRequestedReview: content?.isRequestedReview,
      uploadedBy: content?.uploadedBy
    });
    
    if (!content) {
      return res.status(404).json({ error: '콘텐츠를 찾을 수 없습니다.' });
    }
    if (content.status !== 'approved') {
      return res.status(400).json({ error: '승인되지 않은 콘텐츠입니다.' });
    }
    if (!content.isActive) {
      return res.status(400).json({ error: '비활성화된 콘텐츠입니다.' });
    }

    // 자신의 게시물에 투표 방지
    if (content.uploadedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: '자신의 게시물에는 투표할 수 없습니다.' });
    }

    // 정답 여부 확인 (감별의뢰는 정답에 카운트하지 않음)
    const isRequestedReview = content.isRequestedReview === true;
    const isAI = content.isAI === true;
    const isCorrect = isRequestedReview ? false : vote === (isAI ? 'ai' : 'real');
    const pointsEarned = isCorrect ? 10 : 1; // 정답: 10점, 오답: 1점
    
    console.log('투표 계산:', { isRequestedReview, isAI, vote, isCorrect, pointsEarned });

    // 투표 저장
    const newVote = new Vote({
      content: contentId,
      user: req.user._id,
      vote,
      isCorrect,
      pointsEarned
    });
    
    console.log('투표 객체 생성:', {
      content: newVote.content,
      user: newVote.user,
      vote: newVote.vote,
      isCorrect: newVote.isCorrect,
      pointsEarned: newVote.pointsEarned
    });
    
    await newVote.save();
    console.log('투표 저장 완료:', newVote._id);

    // 오답일 경우 WrongVote 로그 저장 (백그라운드)
    if (!isCorrect) {
      try {
        await WrongVote.create({
          contentId,
          userId: req.user._id,
          wasReal: !isAI,
        });
      } catch (wrongVoteError) {
        console.error('WrongVote 생성 오류:', wrongVoteError);
        // WrongVote 생성 오류는 투표 자체를 실패시키지 않음
      }
    }

    // 콘텐츠 투표수 증가
    if (!content.votes) {
      content.votes = { ai: 0, real: 0 };
    }
    content.votes[vote] += 1;
    content.totalVotes += 1;
    
    // 자동 난이도 계산 및 업데이트
    try {
      await content.updateCalculatedStats();
      console.log('난이도 계산 완료');
    } catch (calcError) {
      console.error('난이도 계산 오류:', calcError);
    }
    
    // 자동 마감 연장 체크
    try {
      await content.autoExtend();
      console.log('마감 연장 체크 완료');
    } catch (extendError) {
      console.error('마감 연장 체크 오류:', extendError);
    }
    
    // 콘텐츠 저장
    await content.save();
    console.log('콘텐츠 저장 완료:', { 
      totalVotes: content.totalVotes, 
      votes: content.votes,
      calculatedDifficulty: content.calculatedDifficulty
    });

    // 사용자 통계 업데이트
    const user = await User.findById(req.user._id);
    console.log('사용자 정보:', { 
      id: user?._id, 
      username: user?.username,
      totalVotes: user?.totalVotes,
      correctVotes: user?.correctVotes,
      points: user?.points
    });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    if (typeof user.totalVotes !== 'number') {
      user.totalVotes = 0;
    }
    if (typeof user.correctVotes !== 'number') {
      user.correctVotes = 0;
    }
    if (typeof user.points !== 'number') {
      user.points = 0;
    }
    
    user.totalVotes += 1;
    user.correctVotes += isCorrect ? 1 : 0;
    user.points += pointsEarned;
    user.lastVoteDate = new Date();

    // 연속 정답 추적
    if (typeof user.consecutiveCorrect !== 'number') {
      user.consecutiveCorrect = 0;
    }
    if (typeof user.maxConsecutiveCorrect !== 'number') {
      user.maxConsecutiveCorrect = 0;
    }
    
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
    
    if (!user.accuracyHistory) {
      user.accuracyHistory = [];
    }
    
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
    console.log('사용자 저장 완료:', { 
      totalVotes: user.totalVotes, 
      correctVotes: user.correctVotes,
      points: user.points,
      consecutiveCorrect: user.consecutiveCorrect
    });

    // 뱃지 확인 및 수여
    let newBadges = [];
    try {
      newBadges = await BadgeSystem.checkAndAwardBadges(req.user._id);
    } catch (badgeError) {
      console.error('뱃지 시스템 오류:', badgeError);
      // 뱃지 시스템 오류는 투표 자체를 실패시키지 않음
    }

    const response = { 
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
    };
    
    console.log('투표 완료 응답:', response);
    res.status(201).json(response);
  } catch (err) {
    console.error('투표 오류:', err);
    console.error('오류 스택:', err.stack);
    console.error('오류 메시지:', err.message);
    console.error('오류 이름:', err.name);
    console.error('오류 코드:', err.code);
    
    // MongoDB 관련 오류 처리
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: '데이터 검증 오류' });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: '잘못된 데이터 형식' });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ error: '이미 투표하셨습니다.' });
    }
    
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