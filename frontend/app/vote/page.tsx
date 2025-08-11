'use client';

import { useState, useEffect } from 'react';
import { getContents, getMe } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function VotePage() {
  const [contents, setContents] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [tab, setTab] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  useEffect(() => {
    loadContents();
    checkAuth();
  }, [page, category, difficulty]);

  const loadContents = async () => {
    try {
      const data = await getContents({ page, limit: 20, category, difficulty });
      setContents(data.contents);
    } catch (error: any) {
      console.error('콘텐츠 로드 실패:', error);
      setError('콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await getMe();
        setUser(data.user);
      }
    } catch (error: any) {
      // 로그인하지 않은 상태로도 투표 목록은 볼 수 있음
    }
  };

  function filteredContents(tab: string, contents: any[]) {
    if (tab === 'all') return contents;
    if (tab === 'progress') return contents.filter(c => c.status !== 'closed');
    if (tab === 'closed') return contents.filter(c => c.status === 'closed');
    if (tab === 'requested') return contents.filter(c => c.isRequestedReview === true);
    return contents;
  }

  const handleContentClick = (contentId: string) => {
    window.location.href = `/vote/${contentId}`;
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
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">투표하기</h1>
          <p className="text-xl text-gray-600">
            AI 생성 콘텐츠와 실제 콘텐츠를 구분해보세요!
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setTab('all')}
            variant={tab === 'all' ? 'default' : 'outline'}
            className="flex-1"
          >
            전체
          </Button>
          <Button
            onClick={() => setTab('progress')}
            variant={tab === 'progress' ? 'default' : 'outline'}
            className="flex-1"
          >
            진행중
          </Button>
          <Button
            onClick={() => setTab('closed')}
            variant={tab === 'closed' ? 'default' : 'outline'}
            className="flex-1"
          >
            마감됨
          </Button>
          <Button
            onClick={() => setTab('requested')}
            variant={tab === 'requested' ? 'default' : 'outline'}
            className="flex-1"
          >
            감별 의뢰
          </Button>
        </div>

        {/* 콘텐츠 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents(tab, contents).map((content: any) => (
            <Card
              key={content._id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleContentClick(content._id)}
            >
              <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                {content.mediaType === 'image' ? (
                  <img
                    src={content.mediaUrl.startsWith('data:') ? content.mediaUrl : content.mediaUrl.startsWith('http') ? content.mediaUrl : `https://eyevsai.onrender.com${content.mediaUrl}`}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={content.mediaUrl.startsWith('data:') ? content.mediaUrl : content.mediaUrl.startsWith('http') ? content.mediaUrl : `https://eyevsai.onrender.com${content.mediaUrl}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* 상태 배지 */}
                {content.isRecycled && (
                  <span className="absolute top-2 left-2 bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded font-semibold shadow">
                    🔁 재투표
                  </span>
                )}
                {content.isRequestedReview && (
                  <span className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-semibold shadow">
                    🔍 감별 요청
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{content.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{content.description}</p>
                
                                 {/* 카테고리 및 태그 */}
                 <div className="flex flex-wrap gap-2 mb-3">
                   <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                     {content.category}
                   </span>
                   {/* 태그 표시 */}
                   {content.tags && content.tags.length > 0 && (
                     content.tags.slice(0, 3).map((tag: string, index: number) => (
                       <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                         #{tag}
                       </span>
                     ))
                   )}
                   {content.tags && content.tags.length > 3 && (
                     <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                       +{content.tags.length - 3}
                     </span>
                   )}
                 </div>

                {/* 참여 정보 */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>{content.status === 'closed' ? '마감됨' : '진행중'}</span>
                  <span>·</span>
                  <span>{content.totalVotes || 0}명 참여</span>
                </div>

                {/* 투표 결과 */}
                {content.totalVotes > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-600 font-bold text-sm">Real</span>
                      <span className="text-gray-500 text-xs">결과</span>
                    </div>
                    <div className="flex w-full h-4 rounded overflow-hidden text-xs font-semibold">
                      <div 
                        className="bg-green-100 text-green-700 flex items-center justify-center" 
                        style={{ width: `${Math.round((content.votes?.real || 0) / content.totalVotes * 100)}%` }}
                      >
                        {Math.round((content.votes?.real || 0) / content.totalVotes * 100)}%
                      </div>
                      <div 
                        className="bg-red-100 text-red-700 flex items-center justify-center" 
                        style={{ width: `${Math.round((content.votes?.ai || 0) / content.totalVotes * 100)}%` }}
                      >
                        {Math.round((content.votes?.ai || 0) / content.totalVotes * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredContents(tab, contents).length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📸</div>
            <p className="text-gray-500 text-lg mb-4">
              {tab === 'all' && '아직 업로드된 콘텐츠가 없습니다'}
              {tab === 'progress' && '진행 중인 콘텐츠가 없습니다'}
              {tab === 'closed' && '마감된 콘텐츠가 없습니다'}
              {tab === 'requested' && '감별 의뢰 콘텐츠가 없습니다'}
            </p>
            <Button 
              onClick={() => window.location.href = '/upload'} 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              첫 콘텐츠 업로드하기
            </Button>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
