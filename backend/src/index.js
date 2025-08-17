const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const voteRoutes = require('./routes/votes');
const userRoutes = require('./routes/users');
const badgeRoutes = require('./routes/badges');
const adminRoutes = require('./routes/admin');
const commentRoutes = require('./routes/comments');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadPath = path.join(__dirname, '../uploads');
console.log('=== STATIC FILE SERVING DEBUG ===');
console.log('Upload path:', uploadPath);
console.log('Upload path exists:', require('fs').existsSync(uploadPath));
console.log('Upload path absolute:', require('path').resolve(uploadPath));
console.log('=== END STATIC FILE DEBUG ===');
app.use('/uploads', express.static(uploadPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eyevsai')
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    
    // 기존 콘텐츠 데이터 정리
    const Content = require('./models/Content');
    Content.deleteMany({}).then(() => {
      console.log('🗑️ 기존 콘텐츠 데이터 정리 완료');
    }).catch(err => {
      console.log('⚠️ 콘텐츠 정리 중 오류:', err.message);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err);
  });

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
}); 