"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getMe, getMyVotesFiltered, getMyVoteStats, getMyBadges, getFollowers, getFollowing, getMyRequestedReviews, withdraw, resetConsecutive, resetStats, updateProfile, checkUsername } from "@/lib/api";
import { User, Vote, VoteStats, UserBadge } from "@/types/content";

export default function MyPage() {
  const [tab, setTab] = useState<string>("overview");
  const [user, setUser] = useState<any>(null);
  const [voteStats, setVoteStats] = useState<any>(null);
  const [correctVotes, setCorrectVotes] = useState<any[]>([]);
  const [wrongVotes, setWrongVotes] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);
  const [requestedReviews, setRequestedReviews] = useState<any[]>([]);
  const [myContents, setMyContents] = useState<any[]>([]);
  
  // 프로필 편집 상태
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // 설정 모달 상태
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState<'consecutive' | 'stats' | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({
    title: '',
    description: '',
    category: 'other',
    tags: [],
    isAI: 'false',
    isRequestedReview: false
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [userData, statsData, badgesData] = await Promise.all([
          getMe(),
          getMyVoteStats(),
          getMyBadges()
        ]);
        
        setUser(userData.user || userData);
        setVoteStats(statsData);
        setBadges(badgesData.badges || []);
        
        // 정답/오답 투표 내역 가져오기
        const [correctData, wrongData, requestedData] = await Promise.all([
          getMyVotesFiltered({ isCorrect: true, limit: 50 }),
          getMyVotesFiltered({ isCorrect: false, limit: 50 }),
          getMyRequestedReviews({ limit: 50 })
        ]);
        
        setCorrectVotes(correctData.votes || []);
        setWrongVotes(wrongData.votes || []);
        setRequestedReviews(requestedData.contents || []);
        
        // 팔로워/팔로잉 목록
        const [followersData, followingData, myContentsData] = await Promise.all([
          getFollowers(userData.user?.id || userData.id),
          getFollowing(userData.user?.id || userData.id),
          getMyContent({ limit: 50 })
        ]);
        setFollowers(followersData.followers || []);
        setFollowing(followingData.following || []);
        setMyContents(myContentsData.contents || []);
      } catch (e: any) {
        setError("내 정보를 불러오지 못했습니다. 로그인 상태를 확인하세요.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 사용자명 중복 확인
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    try {
      const result = await checkUsername(username);
      if (result.available) {
        setIsUsernameAvailable(true);
        setUsernameError('');
      } else {
        setIsUsernameAvailable(false);
        setUsernameError(result.error || '이미 사용 중인 사용자명입니다.');
      }
    } catch (error: any) {
      setIsUsernameAvailable(false);
      setUsernameError('사용자명 확인 중 오류가 발생했습니다.');
    }
  };

  // 사용자명 변경
  const handleUsernameChange = (value: string) => {
    setNewUsername(value);
    setUsernameError('');
    setIsUsernameAvailable(null);

    if (value.length >= 3) {
      checkUsernameAvailability(value);
    }
  };

  // 프로필 업데이트
  const handleUpdateProfile = async () => {
    if (!newUsername.trim() || isUsernameAvailable !== true) {
      setUsernameError('사용 가능한 사용자명을 입력해주세요.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await updateProfile({ username: newUsername });
      setUser(response.user);
      setIsEditingProfile(false);
      setNewUsername('');
      setUsernameError('');
      setIsUsernameAvailable(null);
    } catch (error: any) {
      setUsernameError(error.response?.data?.error || '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 연속정답 초기화
  const handleResetConsecutive = async () => {
    try {
      await resetConsecutive();
      setUser(prev => ({ ...prev, consecutiveCorrect: 0 }));
      setShowResetConfirm(null);
    } catch (error: any) {
      setError('연속정답 초기화에 실패했습니다.');
    }
  };

  // 통계 초기화
  const handleResetStats = async () => {
    try {
      await resetStats();
      setUser(prev => ({
        ...prev,
        totalVotes: 0,
        correctVotes: 0,
        points: 0,
        consecutiveCorrect: 0,
        maxConsecutiveCorrect: 0
      }));
      setVoteStats(prev => ({
        ...prev,
        totalVotes: 0,
        correctVotes: 0,
        accuracy: 0,
        points: 0,
        consecutiveCorrect: 0,
        maxConsecutiveCorrect: 0
      }));
      setShowResetConfirm(null);
    } catch (error: any) {
      setError('통계 초기화에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <div className="text-red-600 text-xl mb-4">{error || "내 정보를 찾을 수 없습니다."}</div>
          <Button onClick={() => window.location.href = '/login'} variant="outline">로그인</Button>
        </div>
      </div>
    );
  }

  const renderBadge = (badge: any) => (
    <div key={badge.badge.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{badge.badge.icon}</div>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{badge.badge.name}</div>
          <div className="text-sm text-gray-600">{badge.badge.description}</div>
          <div className="text-xs text-gray-500 mt-1">
            획득일: {new Date(badge.earnedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-green-600">+{badge.badge.pointsReward}pt</div>
        </div>
      </div>
    </div>
  );

  const renderVoteItem = (vote: any) => (
    <div key={vote.id || vote._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 mb-2 transition-colors">
      <div className={`px-2 py-1 rounded text-xs font-semibold text-white ${
        vote.isCorrect ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {vote.isCorrect ? '정답' : '오답'}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-800">{vote.content?.title || '제목 없음'}</div>
        <div className="text-sm text-gray-500">
          {new Date(vote.createdAt).toLocaleDateString('ko-KR')}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-green-600">+{vote.pointsEarned}pt</div>
      </div>
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleWithdraw = async () => {
    if (confirm('정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await withdraw();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      } catch (error: any) {
        setError('회원탈퇴에 실패했습니다.');
      }
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      await deleteContent(contentId);
      // 콘텐츠 목록 새로고침
      const data = await getMyContent();
      setMyContents(data.contents);
      alert('콘텐츠가 삭제되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '콘텐츠 삭제에 실패했습니다.');
    }
  };

  const handleRevealAnswer = async (contentId: string) => {
    try {
      await revealAnswer(contentId);
      // 콘텐츠 목록 새로고침
      const data = await getMyContent();
      setMyContents(data.contents);
      alert('정답이 공개되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '정답 공개에 실패했습니다.');
    }
  };

  const handleEditContent = (content: any) => {
    setEditingContent(content);
    setEditFormData({
      title: content.title,
      description: content.description,
      category: content.category,
      tags: content.tags || [],
      isAI: content.isAI.toString(),
      isRequestedReview: content.isRequestedReview
    });
    setShowEditModal(true);
  };

  const handleUpdateContent = async () => {
    try {
      await updateContent(editingContent._id, editFormData);
      // 콘텐츠 목록 새로고침
      const data = await getMyContent();
      setMyContents(data.contents);
      setShowEditModal(false);
      alert('콘텐츠가 수정되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '콘텐츠 수정에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </Button>
              <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 프로필 섹션 */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* 프로필 이미지 */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user.avatar ? (
                    <img src={user.avatar} alt="프로필" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    user.username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </div>

              {/* 프로필 정보 */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  {!isEditingProfile && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingProfile(true);
                        setNewUsername(user.username);
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      닉네임 변경
                    </Button>
                  )}
                </div>

                {/* 프로필 편집 모드 */}
                {isEditingProfile && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Input
                        value={newUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="새 닉네임 입력"
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile || isUsernameAvailable !== true}
                        className="flex items-center gap-2"
                      >
                        {isUpdatingProfile ? '저장 중...' : '저장'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setNewUsername('');
                          setUsernameError('');
                          setIsUsernameAvailable(null);
                        }}
                      >
                        취소
                      </Button>
                    </div>
                    {usernameError && (
                      <p className="text-red-600 text-sm mt-2">{usernameError}</p>
                    )}
                    {isUsernameAvailable === true && (
                      <p className="text-green-600 text-sm mt-2">✓ 사용 가능한 닉네임입니다</p>
                    )}
                  </div>
                )}

                {/* 통계 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{user.totalVotes}</div>
                    <div className="text-sm text-gray-600">총 투표</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user.correctVotes}</div>
                    <div className="text-sm text-gray-600">정답</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{user.points}</div>
                    <div className="text-sm text-gray-600">포인트</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{user.consecutiveCorrect}회</div>
                    <div className="text-sm text-gray-600">연속정답</div>
                  </div>
                </div>

                {/* 팔로워/팔로잉 */}
                <div className="flex gap-6 text-sm text-gray-600">
                  <button 
                    className="hover:underline flex items-center gap-1" 
                    onClick={() => setShowFollowList('followers')}
                  >
                    <span className="font-bold text-blue-600">{followers.length}</span>
                    팔로워
                  </button>
                  <button 
                    className="hover:underline flex items-center gap-1" 
                    onClick={() => setShowFollowList('following')}
                  >
                    <span className="font-bold text-blue-600">{following.length}</span>
                    팔로잉
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'overview', label: '개요', icon: '📊' },
            { id: 'votes', label: '투표 내역', icon: '🗳️' },
            { id: 'badges', label: '뱃지', icon: '🏆' },
            { id: 'reviews', label: '감별의뢰', icon: '🔍' },
            { id: 'contents', label: '내 콘텐츠', icon: '📸' }
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                tab === tabItem.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tabItem.icon}</span>
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="space-y-6">
          {/* 개요 탭 */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 정답률 차트 */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">정답률 통계</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">전체 정답률</span>
                      <span className="text-2xl font-bold text-green-600">
                        {user.totalVotes > 0 ? Math.round((user.correctVotes / user.totalVotes) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">최고 연속정답</span>
                      <span className="text-2xl font-bold text-orange-600">{user.maxConsecutiveCorrect}회</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">현재 연속정답</span>
                      <span className="text-2xl font-bold text-blue-600">{user.consecutiveCorrect}회</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 최근 활동 */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">마지막 투표</span>
                      <span className="text-sm text-gray-900">
                        {user.lastVoteDate ? new Date(user.lastVoteDate).toLocaleDateString('ko-KR') : '없음'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">가입일</span>
                      <span className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">획득 뱃지</span>
                      <span className="text-sm text-gray-900">{badges.length}개</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 투표 내역 탭 */}
          {tab === 'votes' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setTab('votes-correct')}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  정답 내역 ({correctVotes.length})
                </button>
                <button
                  onClick={() => setTab('votes-wrong')}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  오답 내역 ({wrongVotes.length})
                </button>
              </div>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">투표 내역</h3>
                  <div className="space-y-2">
                    {correctVotes.slice(0, 10).map(renderVoteItem)}
                    {correctVotes.length === 0 && (
                      <p className="text-gray-500 text-center py-8">아직 투표 내역이 없습니다.</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 뱃지 탭 */}
          {tab === 'badges' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">획득한 뱃지</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {badges.map(renderBadge)}
                  {badges.length === 0 && (
                    <p className="text-gray-500 text-center py-8 col-span-2">아직 획득한 뱃지가 없습니다.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 감별의뢰 탭 */}
          {tab === 'reviews' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">감별의뢰 내역</h3>
                <div className="space-y-2">
                  {requestedReviews.map((content) => (
                    <div key={content.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{content.title}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(content.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {content.status === 'pending' ? '검토 중' : '완료'}
                      </div>
                    </div>
                  ))}
                  {requestedReviews.length === 0 && (
                    <p className="text-gray-500 text-center py-8">감별의뢰 내역이 없습니다.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 내 콘텐츠 탭 */}
          {tab === 'contents' && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">내 업로드 콘텐츠</h3>
                  <Button 
                    onClick={() => window.location.href = '/upload'}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 콘텐츠 업로드
                  </Button>
                </div>
                <div className="space-y-4">
                  {myContents.map((content) => (
                    <div key={content._id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      {/* 썸네일 */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          {content.mediaType === 'image' ? (
                            <img
                              src={content.mediaUrl.startsWith('data:') ? content.mediaUrl : content.mediaUrl.startsWith('http') ? content.mediaUrl : `https://eyevsai.onrender.com${content.mediaUrl}`}
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 콘텐츠 정보 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{content.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            content.status === 'approved' ? 'bg-green-100 text-green-800' :
                            content.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {content.status === 'approved' ? '승인됨' :
                             content.status === 'pending' ? '검토중' : '거절됨'}
                          </span>
                          {content.isRequestedReview && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              감별의뢰
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{content.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>업로드: {new Date(content.createdAt).toLocaleDateString('ko-KR')}</span>
                          <span>투표: {content.totalVotes || 0}회</span>
                          <span>카테고리: {content.category}</span>
                        </div>
                      </div>
                      
                      {/* 액션 버튼 */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/vote/${content._id}`}
                        >
                          보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (content.isAnswerRevealed) {
                              alert('마감된 콘텐츠는 수정할 수 없습니다.');
                              return;
                            }
                            handleEditContent(content);
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) {
                              handleDeleteContent(content._id);
                            }
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          삭제
                        </Button>
                      </div>
                      
                      {/* 마감 관리 */}
                      {!content.isAnswerRevealed && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              마감일: {content.revealDate ? new Date(content.revealDate).toLocaleDateString('ko-KR') : '미설정'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('정답을 지금 공개하시겠습니까?')) {
                                  handleRevealAnswer(content._id);
                                }
                              }}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              정답 공개
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {myContents.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📸</div>
                      <p className="text-gray-500 text-lg mb-4">아직 업로드한 콘텐츠가 없습니다</p>
                      <Button 
                        onClick={() => window.location.href = '/upload'}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                      >
                        첫 콘텐츠 업로드하기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">설정</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">계정 관리</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResetConfirm('consecutive')}
                    className="w-full justify-start"
                  >
                    연속정답 초기화
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResetConfirm('stats')}
                    className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
                  >
                    전체 통계 초기화
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">계정 삭제</h4>
                <Button 
                  variant="outline" 
                  onClick={handleWithdraw}
                  className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
                >
                  회원탈퇴
                </Button>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowSettings(false)}>닫기</Button>
            </div>
          </div>
        </div>
      )}

      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">초기화 확인</h3>
            <p className="text-gray-600 mb-6">
              {showResetConfirm === 'consecutive' 
                ? '연속정답을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
                : '전체 통계를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
              }
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowResetConfirm(null)}>
                취소
              </Button>
              <Button 
                onClick={showResetConfirm === 'consecutive' ? handleResetConsecutive : handleResetStats}
                className="bg-red-600 hover:bg-red-700"
              >
                초기화
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 팔로워/팔로잉 모달 */}
      {showFollowList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {showFollowList === 'followers' ? '팔로워' : '팔로잉'}
            </h3>
            <div className="space-y-2">
              {(showFollowList === 'followers' ? followers : following).map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                  </div>
                </div>
              ))}
              {(showFollowList === 'followers' ? followers : following).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  {showFollowList === 'followers' ? '팔로워가 없습니다.' : '팔로잉이 없습니다.'}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowFollowList(null)}>닫기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 