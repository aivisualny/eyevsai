'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { socialSignup } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function SocialSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // URL 파라미터에서 토큰과 사용자 정보 가져오기
  const token = searchParams.get('token');
  const userParam = searchParams.get('user');

  useEffect(() => {
    if (!token || !userParam) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      setUserInfo(userData);
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    }
  }, [token, userParam, router]);

  // 사용자명 유효성 검사
  const validateUsername = (value: string) => {
    if (value.length < 3) return '사용자명은 3자 이상이어야 합니다.';
    if (value.length > 20) return '사용자명은 20자 이하여야 합니다.';
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(value)) {
      return '사용자명은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.';
    }
    return null;
  };

  // 사용자명 입력 시 실시간 검사
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError('');
    setIsAvailable(null);

    const validationError = validateUsername(value);
    if (validationError) {
      setError(validationError);
      setIsAvailable(false);
      return;
    }

    if (value.length >= 3) {
      // 중복 확인 API 호출
      checkUsernameAvailability(value);
    }
  };

  // 사용자명 중복 확인
  const checkUsernameAvailability = async (username: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://eyevsai.onrender.com'}/api/auth/check-username/${username}`);
      const data = await response.json();
      
      if (data.available) {
        setIsAvailable(true);
        setError('');
      } else {
        setIsAvailable(false);
        setError(data.error || '이미 사용 중인 사용자명입니다.');
      }
    } catch (error) {
      console.error('사용자명 확인 오류:', error);
      setIsAvailable(false);
      setError('사용자명 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('사용자명을 입력해주세요.');
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await socialSignup(token!, username);
      
      // 토큰과 사용자 정보를 로컬 스토리지에 저장
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // 성공 시 메인 페이지로 이동 (강제 새로고침으로 헤더 업데이트)
      window.location.href = '/';
    } catch (error: any) {
      setError(error.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">로딩 중...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="px-8 py-10">
          {/* 헤더 섹션 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              회원가입 완료
            </h2>
            <p className="text-gray-600 text-base">
              사용할 닉네임을 입력해주세요
            </p>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="text-center mb-8">
            {userInfo.avatar && (
              <div className="mb-4">
                <img 
                  src={userInfo.avatar} 
                  alt="프로필" 
                  className="w-20 h-20 rounded-full mx-auto border-3 border-gray-200 shadow-sm"
                />
              </div>
            )}
            <p className="text-sm text-gray-500 font-medium">
              {userInfo.email}
            </p>
          </div>

          {/* 폼 섹션 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                닉네임
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="3-20자, 영문/숫자/한글/_ 사용 가능"
                className={`w-full transition-colors duration-200 ${
                  isAvailable === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                  isAvailable === false ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                  'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                disabled={isLoading}
              />
              
              {/* 상태 메시지 */}
              <div className="min-h-[20px]">
                {isAvailable === true && (
                  <p className="text-green-600 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    사용 가능한 닉네임입니다
                  </p>
                )}
                {isAvailable === false && (
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold"
              disabled={isLoading || !username.trim() || isAvailable !== true}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  가입 중...
                </div>
              ) : (
                '회원가입 완료'
              )}
            </Button>
          </form>

          {/* 안내 메시지 */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              설정한 닉네임은 나중에 마이페이지에서 변경할 수 있습니다
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
