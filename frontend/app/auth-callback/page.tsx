'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('user');
    const error = searchParams.get('error');
    const setup = searchParams.get('setup');
    
    if (error) {
      alert(error);
      window.location.href = '/login';
      return;
    }
    
    if (token) {
      localStorage.setItem('token', token);
      
      if (userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem('user', JSON.stringify(user));
          
          // 프로필 설정이 필요한 경우
          if (setup === 'profile' && !user.isProfileComplete) {
            window.location.href = `/setup-profile?token=${token}&user=${userData}`;
            return;
          }
        } catch (error) {
          console.error('사용자 정보 파싱 오류:', error);
        }
      }
      
      // 일반 로그인 또는 프로필이 완성된 경우
      window.location.href = '/';
    } else {
      alert('로그인에 실패했습니다.');
      window.location.href = '/login';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl mb-4">로그인 처리 중...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
} 