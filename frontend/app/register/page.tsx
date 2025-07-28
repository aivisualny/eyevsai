'use client';

import { useState, useEffect } from 'react';
import { register, checkUsername } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState<any>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<any>({});

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

  // 실시간 유효성검사
  useEffect(() => {
    const errors: any = {};

    // 사용자명 검증
    if (formData.username.length > 0) {
      if (formData.username.length < 3 || formData.username.length > 20) {
        errors.username = '사용자명은 3-20자 사이여야 합니다.';
      } else if (!/^[a-zA-Z0-9가-힣_]+$/.test(formData.username)) {
        errors.username = '사용자명은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.';
      } else if (usernameStatus === 'unavailable') {
        errors.username = '이미 사용 중인 사용자명입니다.';
      }
    }

    // 이메일 검증
    if (formData.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = '올바른 이메일 형식을 입력해주세요.';
      }
    }

    // 비밀번호 검증
    if (formData.password.length > 0) {
      if (formData.password.length < 6) {
        errors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
      } else if (formData.password.length > 50) {
        errors.password = '비밀번호는 50자 이하여야 합니다.';
      }
    }

    // 비밀번호 확인
    if (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setValidationErrors(errors);
  }, [formData, usernameStatus]);

  const validateForm = () => {
    // 사용자명 검증
    if (formData.username.length < 3 || formData.username.length > 20) {
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
      const data = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
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

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'checking':
        return 'text-blue-500';
      case 'available':
        return 'text-green-500';
      case 'unavailable':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">
            Real or AI? 계정을 만들어보세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                사용자명
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="사용자명을 입력하세요 (3-20자)"
                minLength={3}
                maxLength={20}
                className={validationErrors.username ? 'border-red-300' : ''}
              />
              {usernameStatus !== 'idle' && (
                <p className={`mt-1 text-xs ${getUsernameStatusColor()}`}>
                  {usernameMessage}
                </p>
              )}
              {validationErrors.username && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.username}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                영문, 숫자, 한글, 언더스코어(_) 사용 가능
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={validationErrors.email ? 'border-red-300' : ''}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                maxLength={50}
                className={validationErrors.password ? 'border-red-300' : ''}
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.password}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                최소 6자 이상, 최대 50자 이하
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                className={validationErrors.confirmPassword ? 'border-red-300' : ''}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading || usernameStatus !== 'available' || Object.keys(validationErrors).length > 0}
              className="w-full"
            >
              {loading ? '회원가입 중...' : '회원가입'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                로그인
              </a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
} 