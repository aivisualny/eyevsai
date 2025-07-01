'use client';

import { useState, useEffect } from 'react';
import type { Comment } from '@/types/content';
import { useParams } from 'next/navigation';
import { getContent, getComments, postComment, deleteComment, getMe, likeComment, unlikeComment, getCommentLikes, voteContent } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import AIResultPlaceholder from '../../../components/ui/AIResultPlaceholder';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.id as string;

  const [content, setContent] = useState(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState('');

  // 댓글 좋아요 상태 관리
  const [likedComments, setLikedComments] = useState<{ [key: string]: boolean }>({});
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>({});

  const [sortType, setSortType] = useState<'latest' | 'likes' | 'disagree'>('latest');

  useEffect(() => {
    loadContent();
    loadComments();
    checkAuth();
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

  // 댓글 좋아요 정보 불러오기
  const loadCommentLikes = async (commentsList = comments) => {
    const newLikesCount: { [key: string]: number } = {};
    const newLiked: { [key: string]: boolean } = {};
    for (const c of commentsList) {
      const likesData = await getCommentLikes(c._id);
      newLikesCount[c._id] = likesData.count;
      if (user && likesData.users.some((u: any) => u._id === user.id)) {
        newLiked[c._id] = true;
      }
    }
    setLikesCount(newLikesCount);
    setLikedComments(newLiked);
  };

  // 댓글 불러올 때마다 좋아요 정보도 갱신
  const loadComments = async () => {
    try {
      const data = await getComments(contentId);
      setComments(data.comments);
      setTimeout(() => loadCommentLikes(data.comments), 0);
    } catch (error) {}
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await getMe();
        setUser(data.user);
      }
    } catch (error) {}
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await postComment(contentId, commentText.trim());
      setCommentText('');
      loadComments();
    } catch (error: any) {
      alert(error.response?.data?.error || '댓글 작성 실패');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
      loadComments();
    } catch (error: any) {
      alert(error.response?.data?.error || '댓글 삭제 실패');
    }
  };

  // 댓글 좋아요/취소
  const handleLike = async (commentId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (likedComments[commentId]) {
      await unlikeComment(commentId);
    } else {
      await likeComment(commentId);
    }
    loadCommentLikes();
  };

  // 댓글 vote 집계
  const getVoteCounts = (comments) => {
    const agree: { [key: string]: number } = {};
    const disagree: { [key: string]: number } = {};
    comments.forEach(c => {
      if (c.vote === 'agree') agree[c._id] = (agree[c._id] || 0) + 1;
      if (c.vote === 'disagree') disagree[c._id] = (disagree[c._id] || 0) + 1;
    });
    return { agree, disagree };
  };
  const voteCounts = getVoteCounts(comments);

  // 댓글 정렬
  const sortedComments = [...comments].sort((a, b) => {
    if (sortType === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortType === 'likes') return (likesCount[b._id] || 0) - (likesCount[a._id] || 0);
    if (sortType === 'disagree') return (voteCounts.disagree[b._id] || 0) - (voteCounts.disagree[a._id] || 0);
    return 0;
  });

  // 댓글 반박(투표) 핸들러
  const handleVote = async (commentId: string, vote: 'agree' | 'disagree') => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    // 댓글 투표 기능이 별도 API가 없으므로, 실제로는 voteContent를 사용하거나, 이 부분을 주석 처리해야 함
    // await voteComment(commentId, vote);
    // 임시로 경고만 표시
    alert('댓글 투표 기능은 아직 구현되어 있지 않습니다.');
    loadComments();
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
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="overflow-hidden mb-8">
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
          <AIResultPlaceholder />
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
            <p className="text-gray-600 mb-4">{content.description}</p>

            {/* AI 예측 결과 표시 */}
            {(content.predictedDifficulty || content.predictedAccuracy) && (
              <div className="flex items-center gap-4 mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <span className="text-blue-700 font-semibold">AI 예측</span>
                {content.predictedDifficulty && (
                  <span className="text-sm">예상 난이도: <b>{content.predictedDifficulty === 'easy' ? '쉬움' : content.predictedDifficulty === 'normal' ? '보통' : '어려움'}</b></span>
                )}
                {content.predictedAccuracy !== null && (
                  <span className="text-sm">예상 정답률: <b>{content.predictedAccuracy}%</b></span>
                )}
              </div>
            )}

            <div className="flex space-x-4 mb-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {content.category}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {content.difficulty}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              업로드: {new Date(content.createdAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-4 text-sm text-gray-500 mb-2">
              <span>투표: {content.totalVotes}회</span>
              <span>조회: {content.views}회</span>
            </div>
            {content.isAnswerRevealed && (
              <div className="bg-yellow-100 border border-yellow-300 p-2 rounded-lg text-center mb-2">
                <span className="text-yellow-800 font-semibold">
                  정답: {content.isAI ? 'AI 생성' : '실제 콘텐츠'}
                </span>
              </div>
            )}
            {content.isRequestedReview && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-700 text-lg">🔍</span>
                  <div>
                    <div className="text-yellow-800 font-semibold text-sm">감별 요청된 콘텐츠입니다</div>
                    <div className="text-yellow-600 text-xs">당신의 판단을 들려주세요!</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 댓글창 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">댓글</h3>
          {/* 정렬 옵션 */}
          <div className="flex gap-2 mb-4">
            <button className={`px-3 py-1 rounded text-sm font-semibold border ${sortType === 'latest' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`} onClick={() => setSortType('latest')}>최신순</button>
            <button className={`px-3 py-1 rounded text-sm font-semibold border ${sortType === 'likes' ? 'bg-pink-100 border-pink-400 text-pink-700' : 'bg-white border-gray-200 text-gray-500'}`} onClick={() => setSortType('likes')}>공감순</button>
            <button className={`px-3 py-1 rounded text-sm font-semibold border ${sortType === 'disagree' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-white border-gray-200 text-gray-500'}`} onClick={() => setSortType('disagree')}>반박순</button>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
            {sortedComments.length === 0 ? (
              <div className="text-gray-400 text-center">아직 댓글이 없습니다.</div>
            ) : (
              sortedComments.map((c) => (
                <div key={c._id} className="flex items-start space-x-3 group">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                    {c.user?.avatar ? (
                      <img src={c.user.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      c.user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{c.user?.username || '익명'}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-700 text-sm mt-1">{c.text}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-pink-600">공감 {voteCounts.agree[c._id] || 0}</span>
                      <span className="text-xs text-yellow-600">반박 {voteCounts.disagree[c._id] || 0}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center ml-2">
                    <button
                      className={`text-xs px-2 py-1 rounded-full border ${likedComments[c._id] ? 'bg-pink-100 text-pink-600 border-pink-300' : 'bg-gray-100 text-gray-500 border-gray-200'} hover:bg-pink-200`}
                      onClick={() => handleLike(c._id)}
                      disabled={!user}
                      title={user ? (likedComments[c._id] ? '좋아요 취소' : '좋아요') : '로그인 필요'}
                    >
                      ♥ {likesCount[c._id] || 0}
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 mt-1"
                      onClick={() => handleVote(c._id, 'disagree')}
                      disabled={!user}
                      title="반박하기"
                    >
                      반박
                    </button>
                    {user && c.user && user.id === c.user._id && (
                      <button
                        className="text-xs text-red-400 hover:text-red-600 mt-1 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteComment(c._id)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요 (최대 300자)"
              maxLength={300}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!user}
            />
            <Button type="submit" disabled={commentLoading || !user}>
              등록
            </Button>
          </form>
          {!user && (
            <div className="text-xs text-gray-400 mt-2">댓글을 작성하려면 로그인하세요.</div>
          )}
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