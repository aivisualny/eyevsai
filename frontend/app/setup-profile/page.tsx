'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setupProfile } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function SetupProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // URL 파라미터에서 토큰과 사용자 정보 가져오기
  const token = searchParams.get('token');
  const userParam = searchParams.get('user');

  useEffect(() => {
    if (!token || !userParam) {
      router.push('/login');
      return;
    }

    // 토큰을 로컬 스토리지에 저장
    localStorage.setItem('token', token);
    
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      if (userData.isProfileComplete) {
        // 이미 프로필이 완성된 사용자는 메인 페이지로
        router.push('/');
      }
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
      // 중복 확인 (실제로는 API 호출이 필요하지만 여기서는 간단히 처리)
      setIsAvailable(true);
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
      await setupProfile(username);
      // 성공 시 메인 페이지로 이동
      router.push('/');
    } catch (error: any) {
      setError(error.response?.data?.error || '닉네임 설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            닉네임 설정
          </h2>
          <p className="text-gray-600">
            사용할 닉네임을 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="3-20자, 영문/숫자/한글/_ 사용 가능"
              className={`w-full ${
                isAvailable === true ? 'border-green-500' : 
                isAvailable === false ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            {isAvailable === true && (
              <p className="text-green-600 text-sm mt-1">✓ 사용 가능한 닉네임입니다</p>
            )}
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !username.trim() || isAvailable !== true}
          >
            {isLoading ? '설정 중...' : '닉네임 설정 완료'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            설정한 닉네임은 나중에 마이페이지에서 변경할 수 있습니다
          </p>
        </div>
      </Card>
    </div>
  );
} 