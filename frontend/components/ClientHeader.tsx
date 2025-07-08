'use client';
import { useEffect, useState } from 'react';
import Header from './ui/Header';

export default function ClientHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
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