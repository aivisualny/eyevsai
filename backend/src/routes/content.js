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

// Validation schemas
const contentSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(1).max(500).required(),
  category: Joi.string().valid('art', 'photography', 'video', 'text', 'other'),
  tags: Joi.array().items(Joi.string()),
  difficulty: Joi.string().valid('easy', 'medium', 'hard'),
  isAI: Joi.boolean().required()
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
    const { error } = contentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const { title, description, category, tags, difficulty, isAI, isRequestedReview } = req.body;
    
    // Determine media type
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    const content = new Content({
      title,
      description,
      mediaUrl: `/uploads/${req.file.filename}`,
      mediaType,
      category: category || 'other',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
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
    res.status(500).json({ error: 'Failed to upload content' });
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

// AI 난이도 분석 (샘플)
router.post('/analyze', auth, async (req, res) => {
  try {
    // 실제 AI 분석 로직 대신 샘플 난이도/정답률 반환
    // (실제 구현 시 외부 AI API 연동)
    const { imageUrl, text } = req.body;
    // 샘플: 랜덤 난이도/정답률
    const levels = ['easy', 'normal', 'hard'];
    const predictedDifficulty = levels[Math.floor(Math.random() * levels.length)];
    const predictedAccuracy = Math.floor(Math.random() * 100);
    res.json({ predictedDifficulty, predictedAccuracy });
  } catch (err) {
    res.status(500).json({ error: 'AI 분석 오류' });
  }
});

module.exports = router; 