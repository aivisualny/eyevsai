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
  badges: Badge[]
  createdAt: Date
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: Date
}

export interface AITool {
  id: string
  name: string
  description: string
  website: string
  category: 'image' | 'video' | 'text' | 'audio'
} 