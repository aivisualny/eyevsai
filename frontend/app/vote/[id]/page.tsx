'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContent, voteContent } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface Badge {
  name: string;
  description: string;
  icon: string;
  pointsReward: number;
}

export default function VotePage() {
  const params = useParams();
  const contentId = params.id as string;
  
  const [content, setContent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [voting, setVoting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [voteResult, setVoteResult] = useState<any>(null);
  const [showBadgeAlert, setShowBadgeAlert] = useState<boolean>(false);
  const [newBadges, setNewBadges] = useState<any[]>([]);

  useEffect(() => {
    loadContent();
    loadUser();
  }, [contentId]);

  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

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
      const result = await voteContent({ contentId, vote });
      setHasVoted(true);
      setVoteResult(result);
      
      // 새로운 뱃지가 있으면 알림 표시
      if (result.newBadges && result.newBadges.length > 0) {
        setNewBadges(result.newBadges);
        setShowBadgeAlert(true);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || '투표에 실패했습니다.');
    } finally {
      setVoting(false);
    }
  };

  const calculateAccuracy = () => {
    if (!content || content.totalVotes === 0) return 0;
    const correctVotes = content.isAI ? content.votes.ai : content.votes.real;
    return Math.round((correctVotes / content.totalVotes) * 100);
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
        {/* 뱃지 획득 알림 */}
        {showBadgeAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-4">새로운 뱃지를 획득했습니다!</h3>
                <div className="space-y-3 mb-6">
                  {newBadges.map((badge: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{badge.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{badge.name}</div>
                          <div className="text-sm text-gray-600">{badge.description}</div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">+{badge.pointsReward}pt</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setShowBadgeAlert(false)}>
                  확인
                </Button>
              </div>
            </div>
          </div>
        )}

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
                src={content.mediaUrl.startsWith('data:') ? content.mediaUrl : `https://eyevsai.onrender.com${content.mediaUrl}`}
                alt={content.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={content.mediaUrl.startsWith('data:') ? content.mediaUrl : `https://eyevsai.onrender.com${content.mediaUrl}`}
                className="w-full h-full object-contain"
                controls
              />
            )}
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
            <p className="text-gray-600 mb-6">{content.description}</p>
            
                         <div className="flex justify-between items-center mb-6">
               <div className="flex flex-wrap gap-2">
                 <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                   {content.category}
                 </span>
                 {/* 자동 계산된 난이도 표시 */}
                 {content.calculatedDifficulty && (
                   <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                     content.calculatedDifficulty === 'easy' ? 'bg-green-100 text-green-800' :
                     content.calculatedDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                     'bg-red-100 text-red-800'
                   }`}>
                     {content.calculatedDifficulty === 'easy' ? '쉬움' :
                      content.calculatedDifficulty === 'medium' ? '보통' : '어려움'}
                   </span>
                 )}
                 {/* 태그 표시 */}
                 {content.tags && content.tags.length > 0 && (
                   content.tags.map((tag: string, index: number) => (
                     <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                       #{tag}
                     </span>
                   ))
                 )}
               </div>
               <div className="text-sm text-gray-500">
                 업로드: {new Date(content.createdAt).toLocaleDateString()}
               </div>
             </div>

            {/* 정답률 시각화 */}
            {content.totalVotes > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">현재 투표 결과</span>
                  <span className="text-sm text-gray-500">총 {content.totalVotes}표</span>
                </div>
                <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${(content.votes.ai / content.totalVotes) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(content.votes.real / content.totalVotes) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>🤖 AI: {content.votes.ai}표 ({Math.round((content.votes.ai / content.totalVotes) * 100)}%)</span>
                  <span>👤 Real: {content.votes.real}표 ({Math.round((content.votes.real / content.totalVotes) * 100)}%)</span>
                </div>
              </div>
            )}

            {content.isAnswerRevealed ? (
              <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  정답이 공개되었습니다!
                </h3>
                <p className="text-yellow-700">
                  정답: <strong>{content.isAI ? 'AI 생성' : '실제 콘텐츠'}</strong>
                </p>
                <div className="mt-4 text-sm text-yellow-600">
                  전체 정답률: {calculateAccuracy()}%
                </div>
              </div>
            ) : hasVoted && voteResult ? (
              <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  투표 완료!
                </h3>
                <p className="text-blue-700 mb-2">
                  {voteResult.isCorrect ? '🎉 정답입니다!' : '❌ 틀렸습니다.'}
                </p>
                <p className="text-sm text-blue-600">
                  획득 포인트: +{voteResult.pointsEarned}pt
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="mt-3"
                >
                  다른 콘텐츠 투표하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 본인이 업로드한 콘텐츠인지 확인 */}
                {user && content.uploadedBy && user.id === content.uploadedBy ? (
                  <div className="bg-orange-100 border border-orange-300 p-6 rounded-lg text-center">
                    <div className="text-4xl mb-4">🚫</div>
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">
                      본인이 업로드한 콘텐츠입니다
                    </h3>
                    <p className="text-orange-700 mb-4">
                      본인이 업로드한 콘텐츠에는 투표할 수 없습니다.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => window.location.href = '/vote'}
                        variant="outline"
                      >
                        다른 콘텐츠 투표하기
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/mypage'}
                        variant="outline"
                      >
                        내 콘텐츠 관리
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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