const mongoose = require('mongoose');
const Content = require('../models/Content');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const Report = require('../models/Report');
require('dotenv').config();

const clearDb = async () => {
  try {
    console.log('🗑️ 데이터베이스 초기화 시작...');
    
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eyevsai');
    console.log('✅ MongoDB 연결 성공');

    // 모든 데이터 삭제
    const contentResult = await Content.deleteMany({});
    console.log(`✅ ${contentResult.deletedCount}개의 콘텐츠 삭제 완료`);

    const userResult = await User.deleteMany({});
    console.log(`✅ ${userResult.deletedCount}개의 사용자 삭제 완료`);

    const voteResult = await Vote.deleteMany({});
    console.log(`✅ ${voteResult.deletedCount}개의 투표 삭제 완료`);

    const commentResult = await Comment.deleteMany({});
    console.log(`✅ ${commentResult.deletedCount}개의 댓글 삭제 완료`);

    const commentLikeResult = await CommentLike.deleteMany({});
    console.log(`✅ ${commentLikeResult.deletedCount}개의 댓글 좋아요 삭제 완료`);

    const reportResult = await Report.deleteMany({});
    console.log(`✅ ${reportResult.deletedCount}개의 신고 삭제 완료`);

    console.log('🎉 데이터베이스 초기화 완료!');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 데이터베이스 연결 종료');
    process.exit(0);
  }
};

clearDb(); 