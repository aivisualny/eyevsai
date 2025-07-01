'use client';

import { useState, useEffect } from 'react';
import { getMe } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  points: number;
  totalVotes: number;
  correctVotes: number;
  accuracy: number;
};

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await getMe();
      if (data.user.role !== 'admin') {
        alert('관리자 권한이 필요합니다.');
        window.location.href = '/';
        return;
      }
      setUser(data.user);
    } catch (error) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            관리자 페이지
          </h1>
          <p className="text-xl text-gray-600">
            콘텐츠 관리 및 시스템 운영
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">관리자: {user?.username}</h2>
              <p className="text-gray-600">콘텐츠 승인 및 시스템 관리</p>
            </div>
            <Button onClick={() => window.location.href = '/'}>
              홈으로 돌아가기
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">콘텐츠 관리</h3>
            <p className="text-gray-600 mb-4">
              업로드된 콘텐츠를 승인하거나 거절하고, 정답을 공개할 수 있습니다.
            </p>
            <Button onClick={() => alert('콘텐츠 관리 기능은 API 연동 후 사용 가능합니다.')}>
              콘텐츠 관리하기
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">유저 관리</h3>
            <p className="text-gray-600 mb-4">
              유저들의 포인트를 조정하고 활동 내역을 확인할 수 있습니다.
            </p>
            <Button onClick={() => alert('유저 관리 기능은 API 연동 후 사용 가능합니다.')}>
              유저 관리하기
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
} 