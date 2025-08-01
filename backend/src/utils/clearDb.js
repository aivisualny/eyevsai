const mongoose = require('mongoose');
const Content = require('../models/Content');
require('dotenv').config();

const clearDb = async () => {
  try {
    console.log('🗑️ 데이터베이스 초기화 시작...');
    
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eyevsai');
    console.log('✅ MongoDB 연결 성공');

    // 모든 콘텐츠 삭제
    const result = await Content.deleteMany({});
    console.log(`✅ ${result.deletedCount}개의 콘텐츠 삭제 완료`);

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