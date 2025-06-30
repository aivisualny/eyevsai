const express = require('express');
const Joi = require('joi');
const Vote = require('../models/Vote');
const Content = require('../models/Content');
const { auth } = require('../middleware/auth');

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

    // 투표 저장
    const newVote = new Vote({
      content: contentId,
      user: req.user._id,
      vote
    });
    await newVote.save();

    // 콘텐츠 투표수 증가
    content.votes[vote] += 1;
    content.totalVotes += 1;
    await content.save();

    res.status(201).json({ message: '투표 완료', vote: newVote });
  } catch (err) {
    console.error('투표 오류:', err);
    res.status(500).json({ error: '투표 처리 중 오류 발생' });
  }
});

// 내 투표 내역 조회
router.get('/my', auth, async (req, res) => {
  try {
    const votes = await Vote.find({ user: req.user._id }).populate('content');
    res.json({ votes });
  } catch (err) {
    res.status(500).json({ error: '투표 내역 조회 실패' });
  }
});

module.exports = router; 