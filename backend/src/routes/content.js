const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const Content = require('../models/Content');
const { auth, adminAuth } = require('../middleware/auth');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const mongoose = require('mongoose'); // Added for ObjectId conversion

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 배포 환경에서는 상대 경로 사용
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, '../../uploads') 
      : path.join(__dirname, '../../uploads');
    
    console.log('=== UPLOAD DIRECTORY DEBUG ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Upload directory path:', uploadDir);
    console.log('Directory exists:', fs.existsSync(uploadDir));
    
    if (fs.existsSync(uploadDir)) {
      try {
        console.log('Directory permissions:', fs.statSync(uploadDir).mode);
      } catch (error) {
        console.log('Cannot read directory permissions:', error.message);
      }
    }
    
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory...');
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Upload directory created successfully');
      } catch (error) {
        console.error('Failed to create upload directory:', error.message);
        // 현재 디렉토리로 폴백
        const currentDir = path.join(__dirname, '../../uploads');
        console.log('Falling back to current directory:', currentDir);
        try {
          fs.mkdirSync(currentDir, { recursive: true });
          cb(null, currentDir);
        } catch (fallbackError) {
          console.error('Fallback directory creation failed:', fallbackError.message);
          cb(null, path.dirname(__dirname));
        }
        return;
      }
    }
    console.log('=== END DIRECTORY DEBUG ===');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
  // 파일 필터 제거 - 모든 파일 허용
});

// 태그 처리를 별도 함수로 분리 (개선된 버전)
const processTags = (tags) => {
  console.log('=== PROCESS TAGS START ===');
  console.log('Input tags:', tags);
  console.log('Input tags type:', typeof tags);
  
  if (!tags) {
    console.log('No tags provided, returning empty array');
    return [];
  }
  
  try {
    // 문자열인 경우
    if (typeof tags === 'string') {
      console.log('Processing string tags');
      
      // JSON 배열 문자열인지 확인
      if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
        console.log('Detected JSON array string');
        const parsed = JSON.parse(tags);
        console.log('Parsed JSON:', parsed);
        
        if (Array.isArray(parsed)) {
          // 객체 배열인지 확인 (예: [{"label": "태그1"}, {"label": "태그2"}])
          if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].label) {
            console.log('Processing object array with label property');
            const result = parsed
              .map(tag => tag.label?.trim())
              .filter(tag => tag && tag.length > 0)
              .slice(0, 10);
            console.log('Processed object array result:', result);
            return result;
          }
          // 문자열 배열인 경우
          console.log('Processing string array');
          const result = parsed
            .filter(tag => typeof tag === 'string' && tag.trim())
            .map(tag => tag.trim())
            .slice(0, 10);
          console.log('Processed string array result:', result);
          return result;
        }
        console.log('Parsed JSON is not an array, returning empty');
        return [];
      }
      
      // 쉼표로 구분된 문자열
      console.log('Processing comma-separated string');
      const result = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // 최대 10개로 제한
      console.log('Processed comma-separated result:', result);
      return result;
    }
    
    // 배열인 경우
    if (Array.isArray(tags)) {
      console.log('Processing array tags');
      
      // 객체 배열인지 확인
      if (tags.length > 0 && typeof tags[0] === 'object' && tags[0].label) {
        console.log('Processing object array');
        const result = tags
          .map(tag => tag.label?.trim())
          .filter(tag => tag && tag.length > 0)
          .slice(0, 10);
        console.log('Processed object array result:', result);
        return result;
      }
      
      // 문자열 배열인 경우
      console.log('Processing string array');
      const result = tags
        .filter(tag => typeof tag === 'string' && tag.trim())
        .map(tag => tag.trim())
        .slice(0, 10);
      console.log('Processed string array result:', result);
      return result;
    }
    
    console.log('Unknown tags format, returning empty array');
    return [];
  } catch (error) {
    console.error('Tag processing error:', error);
    console.error('Error stack:', error.stack);
    return [];
  } finally {
    console.log('=== PROCESS TAGS END ===');
  }
};

// Validation schemas - tags 필드 수정
const contentSchema = Joi.object({
  title: Joi.string().min(5).max(50).required(),
  description: Joi.string().min(10).max(300).required(),
  category: Joi.string().valid('art', 'photography', 'video', 'text', 'other'),
  difficulty: Joi.string().valid('easy', 'medium', 'hard'),
  isAI: Joi.string().valid('true', 'false').required(),
  // tags 필드 수정 - 더 유연하게 처리
  tags: Joi.any().optional()
}).unknown(true);

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

    // 배포 환경에서는 Base64 데이터 포함
    if (process.env.NODE_ENV === 'production') {
      contents.forEach(content => {
        if (content.mediaData) {
          content.mediaUrl = content.mediaData; // Base64 데이터를 mediaUrl로 사용
        }
      });
    }

    const total = await Content.countDocuments(filter);

    // 디버그: 콘텐츠 정보 로깅
    console.log('=== CONTENTS DEBUG ===');
    contents.forEach((content, index) => {
      console.log(`Content ${index + 1}:`, {
        id: content._id,
        title: content.title,
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        status: content.status
      });
    });
    console.log('=== END DEBUG ===');

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

    // 배포 환경에서는 Base64 데이터 포함
    if (process.env.NODE_ENV === 'production' && content.mediaData) {
      content.mediaUrl = content.mediaData; // Base64 데이터를 mediaUrl로 사용
    }

    // Increment views
    await Content.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Upload new content (authenticated users) - 개선된 디버깅 버전
router.post('/', auth, upload.single('media'), async (req, res) => {
  console.log('=== UPLOAD ROUTE START ===');
  
  try {
    // 1. 인증 확인
    console.log('User authenticated:', req.user ? req.user._id : 'No user');
    console.log('User object:', JSON.stringify(req.user, null, 2));
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 2. 파일 확인
    console.log('File received:', req.file ? 'Yes' : 'No');
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    // 3. 요청 데이터 상세 로깅
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('File info:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      fieldname: req.file.fieldname,
      originalname: req.file.originalname
    });
    console.log('Tags field:', req.body.tags, 'Type:', typeof req.body.tags);
    console.log('isAI field:', req.body.isAI, 'Type:', typeof req.body.isAI);
    console.log('Upload directory exists:', fs.existsSync(req.file.path ? path.dirname(req.file.path) : '/tmp'));
    console.log('File saved path:', req.file.path);
    console.log('File accessible:', fs.existsSync(req.file.path));

    // 4. Joi 검증
    const { error } = contentSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details[0].message);
      return res.status(400).json({ 
        error: error.details[0].message,
        field: error.details[0].path?.join('.'),
        value: error.details[0].context?.value
      });
    }

    // 5. 데이터 추출 및 안전한 처리
    const { title, description, category, tags, difficulty, isAI, isRequestedReview } = req.body;
    console.log('Extracted data:', { title, description, category, difficulty, isAI });

    // 6. 미디어 타입 결정
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    console.log('Media type:', mediaType);

    // 7. 태그 처리 (개선된 로직)
    const tagsArray = processTags(tags);
    console.log('Processed tags array:', tagsArray);
    console.log('Tags validation check:', {
      length: tagsArray.length,
      maxLength: Math.max(...tagsArray.map(tag => tag.length), 0),
      isValid: tagsArray.length <= 10 && tagsArray.every(tag => tag.length <= 20)
    });

    // 8. isAI 안전한 처리
    const isAIBoolean = String(isAI) === 'true';
    console.log('isAI processing:', { original: isAI, processed: isAIBoolean });

    // 9. uploadedBy 안전한 처리
    let uploadedBy;
    try {
      // req.user._id가 문자열인지 ObjectId인지 확인
      if (typeof req.user._id === 'string') {
        uploadedBy = mongoose.Types.ObjectId(req.user._id);
        console.log('Converted string _id to ObjectId');
      } else {
        uploadedBy = req.user._id;
        console.log('Using existing ObjectId');
      }
      console.log('uploadedBy type:', typeof uploadedBy);
      console.log('uploadedBy value:', uploadedBy);
    } catch (error) {
      console.error('ObjectId conversion error:', error);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // 10. Content 객체 생성
    console.log('Creating content object...');
    
    // 파일 경로 상세 로깅
    console.log('=== FILE PATH DEBUG ===');
    console.log('File path:', req.file.path);
    console.log('File filename:', req.file.filename);
    console.log('File dirname:', path.dirname(req.file.path));
    console.log('File exists:', fs.existsSync(req.file.path));
    console.log('File size:', fs.statSync(req.file.path).size);
    console.log('File permissions:', fs.statSync(req.file.path).mode);
    console.log('=== END FILE PATH DEBUG ===');
    
    // Base64 인코딩 (배포 환경용)
    let mediaData = null;
    if (process.env.NODE_ENV === 'production' && req.file.mimetype.startsWith('image/')) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        mediaData = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
        console.log('Base64 encoding successful, size:', mediaData.length);
      } catch (error) {
        console.error('Base64 encoding failed:', error.message);
      }
    }
    
    const contentData = {
      title: title.trim(),
      description: description.trim(),
      mediaUrl: `/uploads/${req.file.filename}`,
      mediaData: mediaData, // Base64 데이터 추가
      mediaType,
      category: category || 'other',
      tags: tagsArray,
      difficulty: difficulty || 'medium',
      isAI: isAIBoolean,
      isRequestedReview: String(isRequestedReview) === 'true',
      uploadedBy: uploadedBy,
      status: 'approved'
    };
    
    console.log('Content data to save:', JSON.stringify(contentData, null, 2));

    // 11. 데이터베이스 저장 전 검증
    console.log('Saving to database...');
    const content = new Content(contentData);
    
    // 저장 전 검증
    const validationError = content.validateSync();
    if (validationError) {
      console.error('Mongoose validation error:', validationError);
      console.error('Validation error details:', JSON.stringify(validationError.errors, null, 2));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationError.errors 
      });
    }

    // 12. 실제 저장 시도
    console.log('Attempting to save content...');
    await content.save();
    console.log('Content saved successfully with ID:', content._id);

    // 13. 응답 전송
    const response = {
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
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.status(201).json(response);

  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    // MongoDB 관련 에러 체크
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation error details:', error.errors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database connection error' });
    }

    // ObjectId 관련 에러 체크
    if (error.name === 'CastError') {
      console.error('Cast error:', error);
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // 파일 시스템 에러 체크
    if (error.code === 'ENOENT' || error.code === 'EACCES') {
      console.error('File system error:', error);
      return res.status(500).json({ error: 'File system error' });
    }

    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Request file:', req.file ? {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    
    res.status(500).json({ error: `Upload failed: ${error.message}` });
  } finally {
    console.log('=== UPLOAD ROUTE END ===');
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

// Admin: Get reported content (신고된 콘텐츠 목록)
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // 신고된 콘텐츠들을 가져옴
    const reports = await Report.find({ status: 'pending' })
      .populate('content', 'title description mediaUrl mediaType category uploadedBy')
      .populate('reporter', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments({ status: 'pending' });

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get reported content error:', error);
    res.status(500).json({ error: 'Failed to fetch reported content' });
  }
});

// Admin: Handle reported content (신고된 콘텐츠 처리)
router.patch('/admin/:id/status', adminAuth, async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (action === 'reject') {
      // 콘텐츠를 비활성화
      await Content.findByIdAndUpdate(report.content, { isActive: false });
      report.status = 'resolved';
    } else {
      // 신고를 무효화
      report.status = 'reviewed';
    }

    report.adminNote = adminNote || '';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    const updatedReport = await Report.findById(report._id)
      .populate('content', 'title description mediaUrl mediaType category')
      .populate('reporter', 'username');

    res.json({
      message: `Content ${action === 'reject' ? 'rejected' : 'approved'} successfully`,
      report: updatedReport
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
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

// 신고하기
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: '신고 사유를 선택해주세요.' });
    }

    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: '콘텐츠를 찾을 수 없습니다.' });
    }

    // 이미 신고한 콘텐츠인지 확인
    const existingReport = await Report.findOne({
      content: req.params.id,
      reporter: req.user._id,
      status: { $in: ['pending', 'reviewed'] }
    });

    if (existingReport) {
      return res.status(400).json({ error: '이미 신고한 콘텐츠입니다.' });
    }

    const report = new Report({
      content: req.params.id,
      reporter: req.user._id,
      reason,
      description: description || ''
    });

    await report.save();

    res.status(201).json({
      message: '신고가 접수되었습니다.',
      report
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({ error: '신고 처리 중 오류가 발생했습니다.' });
  }
});

// 신고된 콘텐츠 목록 (관리자용)
router.get('/admin/reports', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    
    const filter = { status };
    if (status === 'all') delete filter.status;

    const reports = await Report.find(filter)
      .populate('content', 'title description mediaUrl mediaType category')
      .populate('reporter', 'username')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: '신고 목록 조회 실패' });
  }
});

// 신고 처리 (관리자용)
router.patch('/admin/reports/:reportId', adminAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    if (!['reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태입니다.' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      {
        status,
        adminNote: adminNote || '',
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('content', 'title description mediaUrl mediaType category')
     .populate('reporter', 'username');

    if (!report) {
      return res.status(404).json({ error: '신고를 찾을 수 없습니다.' });
    }

    // 신고가 해결되면 해당 콘텐츠를 비활성화
    if (status === 'resolved') {
      await Content.findByIdAndUpdate(report.content._id, { isActive: false });
    }

    res.json({
      message: '신고가 처리되었습니다.',
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: '신고 처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 