'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContent, voteContent } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export default function VotePage() {
  const params = useParams();
  const contentId = params.id as string;
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    loadContent();
  }, [contentId]);

  const loadContent = async () => {
    try {
      const data = await getContent(contentId);
      setContent(data.content);
    } catch (error: any) {
      setError(error.response?.data?.error || '콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote: 'ai' | 'real') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
      return;
    }

    setVoting(true);
    try {
      await voteContent({ contentId, vote });
      setHasVoted(true);
      alert('투표가 완료되었습니다!');
      window.location.href = '/';
    } catch (error: any) {
      setError(error.response?.data?.error || '투표에 실패했습니다.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <Button onClick={() => window.location.href = '/'}>
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">콘텐츠를 찾을 수 없습니다.</div>
          <Button onClick={() => window.location.href = '/'}>
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real or AI?
          </h1>
          <p className="text-xl text-gray-600">
            이 콘텐츠가 AI가 생성한 것인지, 실제 콘텐츠인지 투표해보세요!
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="aspect-video bg-gray-200">
            {content.mediaType === 'image' ? (
              <img
                src={`http://localhost:5000${content.mediaUrl}`}
                alt={content.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={`http://localhost:5000${content.mediaUrl}`}
                className="w-full h-full object-contain"
                controls
              />
            )}
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
            <p className="text-gray-600 mb-6">{content.description}</p>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {content.category}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {content.difficulty}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                업로드: {new Date(content.createdAt).toLocaleDateString()}
              </div>
            </div>

            {content.isAnswerRevealed ? (
              <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  정답이 공개되었습니다!
                </h3>
                <p className="text-yellow-700">
                  정답: <strong>{content.isAI ? 'AI 생성' : '실제 콘텐츠'}</strong>
                </p>
                <div className="mt-4 text-sm text-yellow-600">
                  AI 투표: {content.votes.ai} | 실제 투표: {content.votes.real}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">이 콘텐츠는 무엇일까요?</h3>
                  <p className="text-gray-600">정확한 판단을 위해 자세히 살펴보세요!</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleVote('ai')}
                    disabled={voting || hasVoted}
                    className="h-16 text-lg font-semibold bg-red-500 hover:bg-red-600"
                  >
                    {voting ? '투표 중...' : '🤖 AI 생성'}
                  </Button>
                  <Button
                    onClick={() => handleVote('real')}
                    disabled={voting || hasVoted}
                    className="h-16 text-lg font-semibold bg-green-500 hover:bg-green-600"
                  >
                    {voting ? '투표 중...' : '👤 실제 콘텐츠'}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-500">
                  현재 투표: {content.totalVotes}회
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
} 