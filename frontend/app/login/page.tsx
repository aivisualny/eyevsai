'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, checkUsername } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { SiKakao } from 'react-icons/si';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function SocialButton({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center w-full px-4 py-3 mb-2 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-200"
    >
      <span className="mr-3 text-xl">{icon}</span>
      <span className="flex-1 text-center font-medium">{text}</span>
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // URL에서 에러 메시지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    if (errorMessage) {
      if (errorMessage === 'user_cancelled') {
        setError('소셜 로그인이 취소되었습니다. 다시 시도해주세요.');
      } else {
        setError(decodeURIComponent(errorMessage));
      }
    }
  }, []);

  const validateForm = () => {
    if (mode === 'register') {
      // 회원가입 유효성 검사
      if (!formData.username || formData.username.length < 3 || formData.username.length > 20) {
        setError('사용자명은 3-20자 사이여야 합니다.');
        return false;
      }
      if (!/^[a-zA-Z0-9가-힣_]+$/.test(formData.username)) {
        setError('사용자명은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.');
        return false;
      }
      if (usernameStatus !== 'available') {
        setError('사용자명 중복확인을 완료해주세요.');
        return false;
      }

      // 이메일 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return false;
      }

      // 비밀번호 검증
      if (formData.password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
        return false;
      }
      if (formData.password.length > 50) {
        setError('비밀번호는 50자 이하여야 합니다.');
        return false;
      }

      // 비밀번호 확인
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return false;
      }
    } else {
      // 로그인 유효성 검사
      if (!formData.email || !formData.password) {
        setError('이메일과 비밀번호를 입력해주세요.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        // 회원가입
        const data = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        // 로그인
        const data = await login(formData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      }
    } catch (error: any) {
      setError(error.response?.data?.error || `${mode === 'register' ? '회원가입' : '로그인'}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 사용자명 중복확인
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    setUsernameStatus('checking');
    try {
      const result = await checkUsername(username);
      if (result.available) {
        setUsernameStatus('available');
        setUsernameMessage('사용 가능한 사용자명입니다.');
      } else {
        setUsernameStatus('unavailable');
        setUsernameMessage(result.error || '이미 사용 중인 사용자명입니다.');
      }
    } catch (error: any) {
      setUsernameStatus('unavailable');
      setUsernameMessage(error.response?.data?.error || '사용자명 확인 중 오류가 발생했습니다.');
    }
  };

  // 사용자명 입력 시 중복확인 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleSocialLogin = (provider: string) => {
    // Render.com 배포된 백엔드 URL 사용
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE?.replace('/api', '') || 'https://eyevsai.onrender.com';
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 space-y-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">EyeVSAI</h2>
          <p className="text-sm text-gray-600 mb-4">Real or AI? 계정으로 시작하세요</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            회원가입
          </button>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {/* 회원가입 모드에서만 사용자명 필드 표시 */}
            {mode === 'register' && (
              <div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="사용자명 (3-20자)"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  영문, 숫자, 한글, 언더스코어(_) 사용 가능
                </div>
                {usernameStatus === 'checking' && (
                  <div className="text-xs text-blue-500 mt-1">확인 중...</div>
                )}
                {usernameStatus === 'available' && (
                  <div className="text-xs text-green-500 mt-1">✓ {usernameMessage}</div>
                )}
                {usernameStatus === 'unavailable' && (
                  <div className="text-xs text-red-500 mt-1">✗ {usernameMessage}</div>
                )}
              </div>
            )}

            <div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="이메일"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={mode === 'register' ? '비밀번호 (6자 이상)' : '비밀번호'}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* 회원가입 모드에서만 비밀번호 확인 필드 표시 */}
            {mode === 'register' && (
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호 확인"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            )}

            {/* 로그인 모드에서만 비밀번호 찾기 링크 표시 */}
            {mode === 'login' && (
              <div className="text-right">
                <a href="#" className="text-xs text-blue-500 hover:underline">비밀번호를 잊으셨나요?</a>
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || (mode === 'register' && usernameStatus !== 'available')}
            className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            {loading 
              ? (mode === 'register' ? '회원가입 중...' : '로그인 중...') 
              : (mode === 'register' ? '회원가입' : '로그인')
            }
          </Button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-2 text-gray-400 text-sm">또는</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>
        <div className="space-y-2">
          <SocialButton
            icon={<FaGoogle />}
            text="Continue with Google"
            onClick={() => handleSocialLogin('google')}
          />

          <SocialButton
            icon={<FaFacebook />}
            text="Continue with Facebook"
            onClick={() => handleSocialLogin('facebook')}
          />
          <SocialButton
            icon={<SiKakao />}
            text="Continue with Kakao"
            onClick={() => handleSocialLogin('kakao')}
          />
        </div>
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            소셜 로그인으로 간편하게 시작하세요
          </p>
        </div>
      </Card>
    </div>
  );
} 