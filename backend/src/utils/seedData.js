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

    // 예시 콘텐츠 생성
    const contents = [
      {
        title: 'AI 생성된 풍경화',
        description: 'Midjourney로 생성된 환상적인 풍경화입니다. 자연의 아름다움을 AI가 재해석했습니다.',
        mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
        mediaType: 'image',
        category: 'art',
        difficulty: 'medium',
        isAI: true,
        status: 'approved',
        tags: ['풍경', 'AI아트', 'Midjourney'],
        totalVotes: 45,
        votes: { ai: 28, real: 17 },
        views: 120
      },
      {
        title: '실제 사진작가의 작품',
        description: '프로 사진작가가 촬영한 도시 야경입니다. 긴 노출로 빛의 궤적을 담았습니다.',
        mediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500',
        mediaType: 'image',
        category: 'photography',
        difficulty: 'easy',
        isAI: false,
        status: 'approved',
        tags: ['야경', '도시', '사진'],
        totalVotes: 67,
        votes: { ai: 12, real: 55 },
        views: 89
      },
      {
        title: 'AI 생성된 초상화',
        description: 'Stable Diffusion으로 생성된 고전적인 스타일의 초상화입니다.',
        mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        mediaType: 'image',
        category: 'art',
        difficulty: 'hard',
        isAI: true,
        status: 'approved',
        tags: ['초상화', 'AI아트', 'Stable Diffusion'],
        totalVotes: 34,
        votes: { ai: 19, real: 15 },
        views: 76
      },
      {
        title: '실제 촬영된 음식 사진',
        description: '전문 푸드 포토그래퍼가 촬영한 건강한 샐러드입니다.',
        mediaUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
        mediaType: 'image',
        category: 'photography',
        difficulty: 'easy',
        isAI: false,
        status: 'approved',
        tags: ['음식', '샐러드', '건강'],
        totalVotes: 89,
        votes: { ai: 8, real: 81 },
        views: 156
      },
      {
        title: 'AI 생성된 추상 미술',
        description: 'DALL-E로 생성된 추상적인 미술 작품입니다. 색채와 형태의 조화를 보여줍니다.',
        mediaUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500',
        mediaType: 'image',
        category: 'art',
        difficulty: 'hard',
        isAI: true,
        status: 'approved',
        tags: ['추상', 'AI아트', 'DALL-E'],
        totalVotes: 23,
        votes: { ai: 14, real: 9 },
        views: 45
      },
      {
        title: '실제 건축 사진',
        description: '현대 건축물의 기하학적 아름다움을 담은 사진입니다.',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
        mediaType: 'image',
        category: 'photography',
        difficulty: 'medium',
        isAI: false,
        status: 'approved',
        tags: ['건축', '현대', '기하학'],
        totalVotes: 56,
        votes: { ai: 11, real: 45 },
        views: 98
      }
    ];

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