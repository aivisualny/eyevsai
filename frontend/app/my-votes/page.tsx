'use client';

import { useState, useEffect } from 'react';
import { getMyVotes, getMe } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function MyVotesPage() {
  const [user, setUser] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
      }
      const userData = await getMe();
      setUser(userData.user);
      loadVotes();
    } catch (error) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const loadVotes = async () => {
    try {
      const data = await getMyVotes();
      setVotes(data.votes);
    } catch (error) {
      setError('투표 내역을 불러오는데 실패했습니다.');
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
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            내 투표 내역
          </h1>
          <p className="text-xl text-gray-600">
            내가 참여한 투표들을 확인해보세요
          </p>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">안녕하세요, {user.username}님!</h2>
                <p className="text-gray-600">
                  포인트: {user.points} | 정확도: {user.accuracy}% | 총 투표: {user.totalVotes}회
                </p>
              </div>
              <Button onClick={() => window.location.href = '/'}>
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {votes.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg mb-2">아직 투표한 콘텐츠가 없습니다.</p>
                <p className="mb-4">첫 번째 투표를 해보세요!</p>
                <Button onClick={() => window.location.href = '/'}>
                  콘텐츠 보러가기
                </Button>
              </div>
            </Card>
          ) : (
            votes.map((vote) => (
              <Card key={vote._id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                    {vote.content?.mediaType === 'image' ? (
                      <img
                        src={`http://localhost:5000${vote.content.mediaUrl}`}
                        alt={vote.content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={`http://localhost:5000${vote.content.mediaUrl}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {vote.content?.title || '제목 없음'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {vote.content?.description || '설명 없음'}
                    </p>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="text-sm text-gray-500">
                        투표: {vote.vote === 'ai' ? '🤖 AI 생성' : '👤 실제 콘텐츠'}
                      </span>
                      <span className="text-sm text-gray-500">
                        투표일: {new Date(vote.votedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {vote.isCorrect !== null ? (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        vote.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vote.isCorrect ? '✅ 정답' : '❌ 오답'}
                        {vote.pointsEarned > 0 && ` (+${vote.pointsEarned}점)`}
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        ⏳ 정답 미공개
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {votes.length > 0 && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">투표 통계</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{votes.length}</p>
                  <p className="text-sm text-gray-600">총 투표 수</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {votes.filter(v => v.isCorrect === true).length}
                  </p>
                  <p className="text-sm text-gray-600">정답 수</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {votes.reduce((sum, v) => sum + (v.pointsEarned || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">획득 포인트</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 