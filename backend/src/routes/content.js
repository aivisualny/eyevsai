const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const Content = require('../models/Content');
const { auth, adminAuth } = require('../middleware/auth');
const Comment = require('../models/Comment');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Validation schemas - 태그 검증 완전 제거
const contentSchema = Joi.object({
  title: Joi.string().min(5).max(50).required(),
  description: Joi.string().min(10).max(300).required(),
  category: Joi.string().valid('art', 'photography', 'video', 'text', 'other'),
  difficulty: Joi.string().valid('easy', 'medium', 'hard'),
  isAI: Joi.string().valid('true', 'false').required() // 문자열로 받음
  // tags 필드 완전 제거 - 검증하지 않음
});

// Get all approved content (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty } = req.query;
    
    const filter = { 
      status: 'approved', 
      isActive: true 
    };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const contents = await Content.find(filter)
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-isAI'); // Hide the answer

    const total = await Content.countDocuments(filter);

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({ error: 'Failed to fetch contents' });
  }
});

// Get single content (public)
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('uploadedBy', 'username')
      .select('-isAI'); // Hide the answer

    if (!content || content.status !== 'approved' || !content.isActive) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Increment views
    await Content.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Upload new content (authenticated users)
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    // 요청 데이터 로깅
    console.log('Upload request body:', req.body);
    console.log('Upload request file:', req.file);
    
    // 수동 검증 (Joi 스키마 우회)
    const { title, description, category, difficulty, isAI } = req.body;
    
    if (!title || title.length < 5 || title.length > 50) {
      return res.status(400).json({ error: 'Title must be between 5 and 50 characters' });
    }
    
    if (!description || description.length < 10 || description.length > 300) {
      return res.status(400).json({ error: 'Description must be between 10 and 300 characters' });
    }
    
    if (!isAI || !['true', 'false'].includes(isAI)) {
      return res.status(400).json({ error: 'isAI must be true or false' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const { title, description, category, tags, difficulty, isAI, isRequestedReview } = req.body;
    
    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // 태그 처리: 모든 형태의 입력을 안전하게 처리
    let tagsArray = [];
    console.log('Original tags:', tags, 'Type:', typeof tags);
    
    try {
      if (tags) {
        if (typeof tags === 'string') {
          // 쉼표로 구분된 문자열 처리 (주요 방식)
          tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
          // 배열인 경우 그대로 사용
          tagsArray = tags.filter(tag => tag && tag.trim().length > 0);
        } else {
          // 기타 타입인 경우 빈 배열로 처리
          tagsArray = [];
        }
      }
    } catch (error) {
      console.error('Tag processing error:', error);
      tagsArray = []; // 오류 발생 시 빈 배열로 처리
    }
    
    console.log('Processed tags array:', tagsArray);
    
    const content = new Content({
      title,
      description,
      mediaUrl: `/uploads/${req.file.filename}`,
      mediaType,
      category: category || 'other',
      tags: tagsArray,
      difficulty: difficulty || 'medium',
      isAI: isAI === 'true',
      isRequestedReview: isRequestedReview === 'true',
      uploadedBy: req.user._id
    });

    await content.save();

    res.status(201).json({
      message: 'Content uploaded successfully',
      content: {
        id: content._id,
        title: content.title,
        description: content.description,
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        category: content.category,
        status: content.status
      }
    });
  } catch (error) {
    console.error('Upload content error:', error);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
    res.status(500).json({ error: `Failed to upload content: ${error.message}` });
  }
});

// Get user's uploaded content
router.get('/user/uploads', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const contents = await Content.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments({ uploadedBy: req.user._id });

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get user uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch user uploads' });
  }
});

// Get user's requested review content
router.get('/user/requested-reviews', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const contents = await Content.find({ 
      uploadedBy: req.user._id,
      isRequestedReview: true 
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments({ 
      uploadedBy: req.user._id,
      isRequestedReview: true 
    });

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get requested reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch requested reviews' });
  }
});

// Update content (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this content' });
    }

    if (content.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot update approved/rejected content' });
    }

    const { error } = contentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Delete content (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this content' });
    }

    // Delete file if exists
    if (content.mediaUrl) {
      const filePath = path.join(__dirname, '../..', content.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Content.findByIdAndDelete(req.params.id);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Admin: Get pending content
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const contents = await Content.find({ status: 'pending' })
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments({ status: 'pending' });

    res.json({
      contents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get pending content error:', error);
    res.status(500).json({ error: 'Failed to fetch pending content' });
  }
});

// Admin: Approve/Reject content
router.patch('/admin/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('uploadedBy', 'username');

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      message: `Content ${status} successfully`,
      content
    });
  } catch (error) {
    console.error('Update content status error:', error);
    res.status(500).json({ error: 'Failed to update content status' });
  }
});

// 댓글 목록 조회
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ content: req.params.id })
      .populate('user', 'username avatar')
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: '댓글 조회 실패' });
  }
});

// 댓글 작성
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 1 || text.length > 300) {
      return res.status(400).json({ error: '댓글은 1~300자여야 합니다.' });
    }
    const comment = new Comment({
      content: req.params.id,
      user: req.user._id,
      text
    });
    await comment.save();
    await comment.populate('user', 'username avatar');
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: '댓글 작성 실패' });
  }
});

// 댓글 삭제
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '본인 댓글만 삭제할 수 있습니다.' });
    }
    await comment.deleteOne();
    res.json({ message: '댓글 삭제 완료' });
  } catch (err) {
    res.status(500).json({ error: '댓글 삭제 실패' });
  }
});

// 콘텐츠 재투표 전환
router.post('/:id/recycle', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: '콘텐츠를 찾을 수 없습니다.' });
    if (content.isRecycled) return res.status(400).json({ error: '이미 재투표 상태입니다.' });
    content.isRecycled = true;
    content.recycleAt = new Date();
    content.recycleCount = (content.recycleCount || 0) + 1;
    await content.save();
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ error: '재투표 전환 중 오류' });
  }
});

// 재투표 대상 콘텐츠 목록
router.get('/recycle', async (req, res) => {
  try {
    const recycled = await Content.find({ isRecycled: true }).sort({ recycleAt: -1 });
    res.json({ contents: recycled });
  } catch (err) {
    res.status(500).json({ error: '재투표 콘텐츠 조회 오류' });
  }
});

// AI 난이도 분석 (개선된 로직)
router.post('/analyze', auth, async (req, res) => {
  try {
    const { imageUrl, text } = req.body;
    
    // TODO: 실제 AI API 연동 필요
    // 현재는 텍스트 기반 간단한 분석 로직 (목업)
    let predictedDifficulty = 'medium';
    let predictedAccuracy = 50;
    
    if (text) {
      const textLower = text.toLowerCase();
      
      // 키워드 기반 난이도 분석 (임시)
      const easyKeywords = ['쉬운', '간단한', '명확한', '분명한', '뚜렷한'];
      const hardKeywords = ['복잡한', '어려운', '모호한', '애매한', '추상적인', '세밀한'];
      
      const easyCount = easyKeywords.filter(keyword => textLower.includes(keyword)).length;
      const hardCount = hardKeywords.filter(keyword => textLower.includes(keyword)).length;
      
      if (easyCount > hardCount) {
        predictedDifficulty = 'easy';
        predictedAccuracy = 70 + Math.floor(Math.random() * 20); // 70-90%
      } else if (hardCount > easyCount) {
        predictedDifficulty = 'hard';
        predictedAccuracy = 30 + Math.floor(Math.random() * 30); // 30-60%
      } else {
        predictedDifficulty = 'medium';
        predictedAccuracy = 50 + Math.floor(Math.random() * 20); // 50-70%
      }
    }
    
    // TODO: 이미지 분석 API 연동
    // 예: Google Vision API, Azure Computer Vision, AWS Rekognition 등
    if (imageUrl) {
      // 실제 구현 시:
      // 1. 이미지를 AI 서비스로 전송
      // 2. 이미지 내용 분석 (객체, 텍스트, 품질 등)
      // 3. 분석 결과를 바탕으로 난이도 예측
      console.log('이미지 분석 필요:', imageUrl);
    }
    
    res.json({ predictedDifficulty, predictedAccuracy });
  } catch (err) {
    res.status(500).json({ error: 'AI 분석 오류' });
  }
});

// [AI 탐지기] 실제 AI 서비스 연동 필요
// POST /api/analyze-content
router.post('/analyze-content', async (req, res) => {
  const { contentId } = req.body;
  if (!contentId) {
    return res.status(400).json({ error: 'contentId is required' });
  }
  try {
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // TODO: 실제 AI 탐지 서비스 연동 필요
    // 예시 구현 방향:
    // 1. 이미지/비디오 파일을 AI 서비스로 전송
    // 2. AI 생성 여부 분석 (GAN, Diffusion 모델 탐지)
    // 3. 신뢰도 점수 반환
    // 4. 사용된 모델 정보 저장
    
    // 현재는 목업 데이터만 반환
    const mockResult = {
      aiDetectionResult: content.aiDetectionResult || 'FAKE',
      aiConfidence: content.aiConfidence || Math.floor(Math.random() * 100),
      detectionModel: content.detectionModel || 'Mock Model v1.0'
    };
    
    return res.json(mockResult);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 