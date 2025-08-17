'use client';
import { useEffect, useState } from 'react';
import Header from './ui/Header';
import { isTokenValid } from '../lib/api';

export default function ClientHeader() {
  const [user, setUser] = useState<any>(null);

  // 사용자 정보를 가져오는 함수
  const loadUser = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    
    // 토큰 유효성 검사
    if (token && userStr && isTokenValid()) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      setUser(null);
      // 유효하지 않은 토큰 제거
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  useEffect(() => {
    loadUser();
    
    // storage 이벤트 리스너 추가 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        loadUser();
      }
    };

    // 페이지 포커스 시 사용자 정보 다시 확인
    const handleFocus = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/';
    }
  };

  return <Header user={user} onLogout={handleLogout} />;
} 