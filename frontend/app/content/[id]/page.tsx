'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContent, getComments, postComment, deleteComment, getMe } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.id as string;

  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadComments = async () => {
    try {
      const data = await getComments(contentId);
      setComments(data.comments);
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
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
            <p className="text-gray-600 mb-4">{content.description}</p>
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
          </div>
        </Card>

        {/* 댓글창 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">댓글</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
            {comments.length === 0 ? (
              <div className="text-gray-400 text-center">아직 댓글이 없습니다.</div>
            ) : (
              comments.map((c) => (
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
                  </div>
                  {user && c.user && user.id === c.user._id && (
                    <button
                      className="text-xs text-red-400 hover:text-red-600 ml-2 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteComment(c._id)}
                    >
                      삭제
                    </button>
                  )}
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