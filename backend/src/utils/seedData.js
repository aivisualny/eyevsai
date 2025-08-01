const User = require('../models/User');
const Content = require('../models/Content');

const seedData = async () => {
  try {
    console.log('🌱 시드 데이터 생성 시작...');

    // 관리자 계정 생성
    const adminExists = await User.findOne({ email: 'admin@eyevsai.com' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@eyevsai.com',
        password: 'admin123',
        role: 'admin',
        points: 1000
      });
      await admin.save();
      console.log('✅ 관리자 계정 생성 완료');
    }

    // 테스트 유저 계정 생성
    const testUserExists = await User.findOne({ email: 'test@eyevsai.com' });
    if (!testUserExists) {
      const testUser = new User({
        username: 'testuser',
        email: 'test@eyevsai.com',
        password: 'test123',
        role: 'user',
        points: 150
      });
      await testUser.save();
      console.log('✅ 테스트 유저 계정 생성 완료');
    }

    // 예시 콘텐츠 생성 (빈 배열로 변경)
    const contents = [];

    for (const contentData of contents) {
      const existingContent = await Content.findOne({ title: contentData.title });
      if (!existingContent) {
        const user = await User.findOne({ role: 'user' });
        const content = new Content({
          ...contentData,
          uploadedBy: user._id
        });
        await content.save();
      }
    }
    console.log('✅ 예시 콘텐츠 생성 완료');

    console.log('🎉 시드 데이터 생성 완료!');
    console.log('📧 관리자 계정: admin@eyevsai.com / admin123');
    console.log('📧 테스트 계정: test@eyevsai.com / test123');

  } catch (error) {
    console.error('❌ 시드 데이터 생성 실패:', error);
  }
};

module.exports = seedData; 