export const SITE_CONFIG = {
  name: 'EyeVSAI',
  description: '당신의 눈은 AI보다 정확한가?',
  url: 'https://eyevsai.com',
  ogImage: '/og-image.png',
  links: {
    twitter: 'https://twitter.com/eyevsai',
    github: 'https://github.com/eyevsai',
  },
}

export const NAVIGATION = [
  { name: '홈', href: '/' },
  { name: '투표하기', href: '/vote' },
  { name: '업로드', href: '/upload' },
  { name: '랭킹', href: '/leaderboard' },
  { name: '통계', href: '/stats' },
]

export const AI_TOOLS = [
  { value: 'Midjourney', label: 'Midjourney' },
  { value: 'DALL-E', label: 'DALL-E' },
  { value: 'Stable Diffusion', label: 'Stable Diffusion' },
  { value: 'Runway', label: 'Runway' },
  { value: 'Adobe Firefly', label: 'Adobe Firefly' },
  { value: '기타', label: '기타' },
]

export const UPLOAD_GUIDELINES = [
  '적절하지 않은 콘텐츠는 업로드하지 마세요',
  '저작권이 있는 콘텐츠는 업로드하지 마세요',
  '정확한 정보를 제공해주세요',
  '업로드된 콘텐츠는 운영자 검토 후 게시됩니다',
]

export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}

export const VOTE_DURATION = {
  default: 7 * 24 * 60 * 60 * 1000, // 7일
  min: 1 * 24 * 60 * 60 * 1000, // 1일
  max: 30 * 24 * 60 * 60 * 1000, // 30일
} 