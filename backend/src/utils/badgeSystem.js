const Badge = require('../models/Badge');
const User = require('../models/User');

class BadgeSystem {
  // 사용자의 뱃지 획득 조건 확인
  static async checkAndAwardBadges(userId) {
    try {
      const user = await User.findById(userId).populate('badges.badge');
      
      // 뱃지가 없는 경우 빈 배열로 처리
      const earnedBadgeIds = user.badges && user.badges.length > 0 
        ? user.badges.map(b => b.badge && b.badge._id ? b.badge._id.toString() : null).filter(id => id !== null)
        : [];
      
      // 모든 활성 뱃지 가져오기
      const allBadges = await Badge.find({ isActive: true });
      
      const newBadges = [];
      
      for (const badge of allBadges) {
        // 이미 획득한 뱃지는 스킵
        if (earnedBadgeIds.includes(badge._id.toString())) {
          continue;
        }
        
        // 조건 확인
        if (await this.checkBadgeCondition(user, badge)) {
          newBadges.push(badge);
        }
      }
      
      // 새로운 뱃지가 있으면 사용자에게 추가
      if (newBadges.length > 0) {
        const badgeEntries = newBadges.map(badge => ({
          badge: badge._id,
          earnedAt: new Date()
        }));
        
        await User.findByIdAndUpdate(userId, {
          $push: { badges: { $each: badgeEntries } },
          $inc: { points: newBadges.reduce((sum, badge) => sum + badge.pointsReward, 0) }
        });
        
        return newBadges;
      }
      
      return [];
    } catch (error) {
      console.error('Badge check error:', error);
      return [];
    }
  }
  
  // 뱃지 조건 확인
  static async checkBadgeCondition(user, badge) {
    const { condition } = badge;
    let userValue;
    
    switch (condition.type) {
      case 'totalVotes':
        userValue = user.totalVotes;
        break;
      case 'correctVotes':
        userValue = user.correctVotes;
        break;
      case 'accuracy':
        userValue = user.getAccuracy();
        break;
      case 'consecutiveCorrect':
        userValue = user.maxConsecutiveCorrect;
        break;
      case 'uploadCount':
        // Content 모델에서 사용자가 업로드한 콘텐츠 수 계산
        const Content = require('../models/Content');
        userValue = await Content.countDocuments({ uploader: user._id });
        break;
      case 'points':
        userValue = user.points;
        break;
      default:
        return false;
    }
    
    switch (condition.operator) {
      case 'gte':
        return userValue >= condition.value;
      case 'lte':
        return userValue <= condition.value;
      case 'eq':
        return userValue === condition.value;
      default:
        return false;
    }
  }
  
  // 기본 뱃지 데이터 생성
  static async createDefaultBadges() {
    const defaultBadges = [
      {
        name: '첫 투표',
        description: '첫 번째 투표를 완료했습니다!',
        icon: '🎯',
        category: 'participation',
        condition: { type: 'totalVotes', value: 1, operator: 'gte' },
        pointsReward: 10
      },
      {
        name: 'AI 탐정가',
        description: '정답률 70% 이상을 달성했습니다!',
        icon: '🔍',
        category: 'accuracy',
        condition: { type: 'accuracy', value: 70, operator: 'gte' },
        pointsReward: 50
      },
      {
        name: 'AI 마스터',
        description: '정답률 90% 이상을 달성했습니다!',
        icon: '👑',
        category: 'accuracy',
        condition: { type: 'accuracy', value: 90, operator: 'gte' },
        pointsReward: 100
      },
      {
        name: '열정적인 참여자',
        description: '100번의 투표를 완료했습니다!',
        icon: '🔥',
        category: 'participation',
        condition: { type: 'totalVotes', value: 100, operator: 'gte' },
        pointsReward: 30
      },
      {
        name: '연속 정답왕',
        description: '연속 10번 정답을 맞췄습니다!',
        icon: '⚡',
        category: 'achievement',
        condition: { type: 'consecutiveCorrect', value: 10, operator: 'gte' },
        pointsReward: 40
      },
      {
        name: '콘텐츠 크리에이터',
        description: '첫 번째 콘텐츠를 업로드했습니다!',
        icon: '📸',
        category: 'participation',
        condition: { type: 'uploadCount', value: 1, operator: 'gte' },
        pointsReward: 20
      }
    ];
    
    for (const badgeData of defaultBadges) {
      const existingBadge = await Badge.findOne({ name: badgeData.name });
      if (!existingBadge) {
        await Badge.create(badgeData);
      }
    }
  }
  
  // 정답률 낮은 콘텐츠 자동 리사이클
  static async recycleLowAccuracyContents(threshold = 60) {
    const Content = require('../models/Content');
    // 마감된 콘텐츠 중 정답률 60% 이하인 것만
    const candidates = await Content.find({ status: 'closed', isRecycled: false });
    for (const content of candidates) {
      const realPercent = content.getRealPercentage();
      if (realPercent <= threshold) {
        content.isRecycled = true;
        content.recycleCount = (content.recycleCount || 0) + 1;
        content.recycleAt = new Date();
        await content.save();
      }
    }
  }
}

module.exports = BadgeSystem; 