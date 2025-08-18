const mongoose = require('mongoose');
const User = require('../models/User');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const Report = require('../models/Report');
require('dotenv').config();

const clearUser = async (email) => {
  try {
    console.log(`🗑️ 사용자 데이터 초기화 시작: ${email}`);
    
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eyevsai');
    console.log('✅ MongoDB 연결 성공');

    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ 사용자를 찾을 수 없습니다: ${email}`);
      return;
    }

    console.log(`✅ 사용자 발견: ${user.username} (${user.email})`);

    // 사용자 관련 데이터 삭제
    const voteResult = await Vote.deleteMany({ userId: user._id });
    console.log(`✅ ${voteResult.deletedCount}개의 투표 삭제 완료`);

    const commentResult = await Comment.deleteMany({ userId: user._id });
    console.log(`✅ ${commentResult.deletedCount}개의 댓글 삭제 완료`);

    const commentLikeResult = await CommentLike.deleteMany({ userId: user._id });
    console.log(`✅ ${commentLikeResult.deletedCount}개의 댓글 좋아요 삭제 완료`);

    const reportResult = await Report.deleteMany({ 
      $or: [{ reporterId: user._id }, { reportedUserId: user._id }] 
    });
    console.log(`✅ ${reportResult.deletedCount}개의 신고 삭제 완료`);

    // 사용자 삭제
    const userResult = await User.deleteOne({ _id: user._id });
    console.log(`✅ 사용자 삭제 완료`);

    console.log(`🎉 사용자 데이터 초기화 완료: ${email}`);
  } catch (error) {
    console.error('❌ 사용자 데이터 초기화 실패:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 데이터베이스 연결 종료');
    process.exit(0);
  }
};

// 명령행 인수로 이메일 받기
const email = process.argv[2];
if (!email) {
  console.log('❌ 사용법: node clearUser.js <email>');
  process.exit(1);
}

clearUser(email);
