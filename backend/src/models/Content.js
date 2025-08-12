const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaData: {
    type: String, // Base64 encoded image data
    required: false
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  category: {
    type: String,
    enum: ['art', 'photography', 'video', 'text', 'other'],
    default: 'other'
  },
  isAI: {
    type: Boolean,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  votes: {
    ai: { type: Number, default: 0 },
    real: { type: Number, default: 0 }
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  isAnswerRevealed: {
    type: Boolean,
    default: false
  },
  revealDate: {
    type: Date,
    default: null
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return tags.length <= 10 && tags.every(tag => tag.length <= 20);
      },
      message: 'Tags must be at most 10 items and each tag must be at most 20 characters'
    },
    default: []
  },

  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRecycled: {
    type: Boolean,
    default: false
  },
  isRequestedReview: {
    type: Boolean,
    default: false
  },
  recycleAt: {
    type: Date,
    default: null
  },
  recycleCount: {
    type: Number,
    default: 0
  },
  // 자동 난이도 계산 (정답률 기반)
  calculatedDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: null
  },
  accuracyRate: {
    type: Number,
    default: null
  },
  
  // AI 생성 정보 (마감 후 공개)
  aiGenerationInfo: {
    aiModel: { type: String, default: null }, // 사용된 AI 모델
    prompt: { type: String, default: null }, // 사용된 프롬프트
    generationDate: { type: Date, default: null }, // 생성 날짜
    generationSettings: { type: Object, default: null }, // 생성 설정
    isInfoRevealed: { type: Boolean, default: false } // 정보 공개 여부
  },
  
  // AI 탐지 결과
  aiDetectionResult: {
    type: String,
    enum: ['REAL', 'FAKE', null],
    default: null
  },
  aiConfidence: {
    type: Number,
    default: null
  },
  detectionModel: {
    type: String,
    default: null
  },
  
  // 사용자 피드백
  userFeedback: {
    accuracyRating: { type: Number, min: 1, max: 5, default: null }, // 정확성 평가 (1-5점)
    feedbackCount: { type: Number, default: 0 }, // 피드백 수
    averageRating: { type: Number, default: null } // 평균 평점
  },
  
  // 마감 관리
  scheduledRevealDate: {
    type: Date,
    default: function() {
      // 기본 7일 후 마감
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  autoExtended: {
    type: Boolean,
    default: false
  },
  extensionCount: {
    type: Number,
    default: 0
  },
  
  // 콘텐츠 수정 이력
  editHistory: [{
    field: { type: String, required: true }, // 수정된 필드
    oldValue: { type: String, required: true }, // 이전 값
    newValue: { type: String, required: true }, // 새로운 값
    editedAt: { type: Date, default: Date.now }, // 수정 시간
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // 수정자
  }],
  
  // 예측 정보 (기존)
  predictedDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  predictedAccuracy: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  strict: false // 디버깅을 위해 임시로 false로 설정
});

// Index for better query performance
contentSchema.index({ status: 1, isActive: 1 });
contentSchema.index({ category: 1, status: 1 });
contentSchema.index({ uploadedBy: 1 });

// Calculate AI percentage
contentSchema.methods.getAIPercentage = function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votes.ai / this.totalVotes) * 100);
};

// Calculate real percentage
contentSchema.methods.getRealPercentage = function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.votes.real / this.totalVotes) * 100);
};

// Calculate accuracy rate (정답률 계산)
contentSchema.methods.calculateAccuracyRate = function() {
  if (this.totalVotes === 0) return 0;
  const correctVotes = this.isAI ? this.votes.ai : this.votes.real;
  return Math.round((correctVotes / this.totalVotes) * 100);
};

// Calculate difficulty based on accuracy (정답률 기반 난이도 계산)
contentSchema.methods.calculateDifficulty = function() {
  const accuracy = this.calculateAccuracyRate();
  
  if (accuracy >= 70) return 'easy';
  if (accuracy >= 50) return 'medium';
  return 'hard';
};

// Update calculated difficulty and accuracy
contentSchema.methods.updateCalculatedStats = function() {
  this.calculatedDifficulty = this.calculateDifficulty();
  return this.save();
};

// Check if content should be auto-extended (자동 연장 체크)
contentSchema.methods.shouldAutoExtend = function() {
  // 투표 수가 10개 미만이고 7일이 지났으면 연장
  if (this.totalVotes < 10 && this.extensionCount < 2) {
    const now = new Date();
    const revealDate = new Date(this.scheduledRevealDate);
    return now > revealDate;
  }
  return false;
};

// Auto-extend reveal date (자동 연장)
contentSchema.methods.autoExtend = function() {
  if (this.shouldAutoExtend()) {
    const newDate = new Date(this.scheduledRevealDate);
    newDate.setDate(newDate.getDate() + 7); // 7일 추가
    this.scheduledRevealDate = newDate;
    this.autoExtended = true;
    this.extensionCount += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Content', contentSchema); 