'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { FaGoogle, FaFacebook, FaGithub } from 'react-icons/fa';
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
  const [formData, setFormData] = useState<any>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (error: any) {
      setError(error.response?.data?.error || '로그인에 실패했습니다.');
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

  const handleSocialLogin = (provider: string) => {
    // 배포 환경에서는 백엔드 URL, 로컬에서는 localhost 사용
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://eyevsai.onrender.com' 
      : 'http://localhost:5000';
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 space-y-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인</h2>
          <p className="text-sm text-gray-600 mb-4">Real or AI? 계정으로 로그인하세요</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="EMAIL"
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
                placeholder="PASSWORD"
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
            <div className="text-right">
              <a href="#" className="text-xs text-blue-500 hover:underline">비밀번호를 잊으셨나요?</a>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            {loading ? '로그인 중...' : 'Log In'}
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
            icon={<FaGithub />}
            text="Continue with GitHub"
            onClick={() => handleSocialLogin('github')}
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
          <span className="text-gray-500">New to EyeVSAI?</span>
          <a href="/register" className="ml-2 text-blue-500 hover:underline">회원가입</a>
        </div>
      </Card>
    </div>
  );
} 