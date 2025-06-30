export interface Content {
  id: string
  title: string
  description: string
  imageUrl: string
  isReal: boolean
  totalVotes: number
  realVotes: number
  fakeVotes: number
  createdAt: Date
  expiresAt: Date
  isExpired: boolean
  aiTool: string | null // AI 생성 도구명 (Midjourney, DALL-E 등)
}

export interface Vote {
  id: string
  contentId: string
  userId?: string
  isReal: boolean
  isCorrect?: boolean
  pointsEarned?: number
  createdAt: Date
}

export interface User {
  id: string
  username: string
  email: string
  points: number
  accuracy: number
  totalVotes: number
  correctVotes: number
  consecutiveCorrect: number
  maxConsecutiveCorrect: number
  badges: UserBadge[]
  createdAt: Date
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'accuracy' | 'participation' | 'achievement' | 'special'
  condition: {
    type: 'totalVotes' | 'correctVotes' | 'accuracy' | 'consecutiveCorrect' | 'uploadCount' | 'points'
    value: number
    operator: 'gte' | 'lte' | 'eq'
  }
  pointsReward: number
  isActive: boolean
}

export interface UserBadge {
  badge: Badge
  earnedAt: Date
}

export interface VoteStats {
  totalVotes: number
  correctVotes: number
  accuracy: number
  points: number
  consecutiveCorrect: number
  maxConsecutiveCorrect: number
  last7Days: DailyStats[]
}

export interface DailyStats {
  date: string
  totalVotes: number
  correctVotes: number
  accuracy: number
}

export interface AITool {
  id: string
  name: string
  description: string
  website: string
  category: 'image' | 'video' | 'text' | 'audio'
}

export interface CommentLike {
  user: User;
  comment: string;
  createdAt: Date;
}

export interface RecycledContent {
  id: string;
  title: string;
  isRecycled: boolean;
  recycleAt: Date;
  recycleCount: number;
  predictedDifficulty?: 'easy' | 'normal' | 'hard';
  predictedAccuracy?: number;
}

export interface FollowUser {
  id: string;
  username: string;
}

export interface UserWithFollow extends User {
  followers: FollowUser[];
  following: FollowUser[];
} 