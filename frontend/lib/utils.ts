import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  
  if (diff <= 0) return '마감됨'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}일 ${hours}시간 남음`
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`
  if (minutes > 0) return `${minutes}분 남음`
  return '곧 마감'
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: '이미지 파일만 업로드 가능합니다.' }
  }

  // 파일 크기 검증 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: '파일 크기는 10MB 이하여야 합니다.' }
  }

  return { isValid: true }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
} 

// 회원정보 초기화 함수
export const clearUserData = () => {
  try {
    // 로컬 스토리지에서 사용자 관련 데이터 제거
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 세션 스토리지도 확인하여 제거
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // 쿠키도 확인하여 제거 (있다면)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('사용자 데이터 초기화 완료');
    return true;
  } catch (error) {
    console.error('사용자 데이터 초기화 실패:', error);
    return false;
  }
};

// 토큰 유효성 검사 함수
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // JWT 토큰의 만료 시간 확인
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return false;
  }
}; 