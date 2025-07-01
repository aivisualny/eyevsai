"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { getMe, getMyVotesFiltered, getMyVoteStats, getMyBadges, getFollowers, getFollowing, getMyRequestedReviews } from "@/lib/api";
import { User, Vote, VoteStats, UserBadge } from "@/types/content";

export default function MyPage() {
  const [tab, setTab] = useState("overview");
  const [user, setUser] = useState<User | null>(null);
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const [correctVotes, setCorrectVotes] = useState<Vote[]>([]);
  const [wrongVotes, setWrongVotes] = useState<Vote[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);
  const [requestedReviews, setRequestedReviews] = useState([]);

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
        const [followersData, followingData] = await Promise.all([
          getFollowers(userData.user?.id || userData.id),
          getFollowing(userData.user?.id || userData.id)
        ]);
        setFollowers(followersData.followers || []);
        setFollowing(followingData.following || []);
      } catch (e) {
        setError("내 정보를 불러오지 못했습니다. 로그인 상태를 확인하세요.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">로딩 중...</div>;
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

  const renderBadge = (badge: UserBadge) => (
    <div key={badge.badge.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
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

  const renderVoteItem = (vote: Vote) => (
    <div key={vote.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
      <div className={`px-2 py-1 rounded text-xs font-semibold text-white ${
        vote.isCorrect ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {vote.isCorrect ? '정답' : '오답'}
      </div>
      <div className="flex-1">
        <div className="font-medium">{vote.content?.title || '제목 없음'}</div>
        <div className="text-sm text-gray-500">
          {new Date(vote.createdAt).toLocaleDateString('ko-KR')}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-blue-600">+{vote.pointsEarned || 0}pt</div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 상단 프로필 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                user.username[0].toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{user.username}</h1>
              <div className="flex gap-6 mt-2 text-sm text-gray-600">
                <div>포인트 <span className="font-bold text-blue-600">{user.points}pt</span></div>
                <div>정답률 <span className="font-bold text-green-600">{user.accuracy}%</span></div>
                <div>총 투표 <span className="font-bold text-gray-800">{user.totalVotes}회</span></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">연속 정답</div>
              <div className="text-2xl font-bold text-orange-600">{user.consecutiveCorrect}회</div>
            </div>
          </div>
          {/* 팔로워/팔로잉 수 및 목록 버튼 */}
          <div className="flex gap-6 mt-4 text-sm text-gray-600">
            <button className="hover:underline" onClick={() => setShowFollowList('followers')}>
              팔로워 <span className="font-bold text-blue-600">{followers.length}</span>
            </button>
            <button className="hover:underline" onClick={() => setShowFollowList('following')}>
              팔로잉 <span className="font-bold text-blue-600">{following.length}</span>
            </button>
          </div>
          {/* 팔로워/팔로잉 목록 모달 */}
          {showFollowList && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-xs w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    {showFollowList === 'followers' ? '팔로워' : '팔로잉'} 목록
                  </h3>
                  <button onClick={() => setShowFollowList(null)} className="text-gray-400 hover:text-gray-700">✕</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(showFollowList === 'followers' ? followers : following).length === 0 ? (
                    <div className="text-gray-400 text-center py-8">없음</div>
                  ) : (
                    (showFollowList === 'followers' ? followers : following).map((u: any) => (
                      <div key={u.id || u._id} className="flex items-center gap-2 p-2 border rounded">
                        <span className="font-semibold">{u.username}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            {[
              { id: 'overview', label: '📊 개요', count: null },
              { id: 'correct', label: '✅ 맞힌 콘텐츠', count: correctVotes.length },
              { id: 'wrong', label: '❌ 틀린 콘텐츠', count: wrongVotes.length },
              { id: 'requested', label: '🔍 감별 요청', count: requestedReviews.length },
              { id: 'badges', label: '🏅 뱃지', count: badges.length }
            ].map((tabItem) => (
              <button
                key={tabItem.id}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${
                  tab === tabItem.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setTab(tabItem.id)}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tabItem.label}</span>
                  {tabItem.count !== null && (
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {tabItem.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 내용 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {tab === 'overview' && voteStats && (
            <div className="space-y-6">
              {/* 통계 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{voteStats.totalVotes}</div>
                  <div className="text-sm text-gray-600">총 투표</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{voteStats.correctVotes}</div>
                  <div className="text-sm text-gray-600">정답</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{voteStats.accuracy}%</div>
                  <div className="text-sm text-gray-600">정답률</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{voteStats.points}</div>
                  <div className="text-sm text-gray-600">포인트</div>
                </div>
              </div>

              {/* 최근 7일 정답률 차트 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">최근 7일 정답률</h3>
                <div className="grid grid-cols-7 gap-2">
                  {voteStats.last7Days.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="bg-gray-200 rounded h-20 relative">
                        <div 
                          className="bg-green-500 rounded-b absolute bottom-0 w-full transition-all duration-300"
                          style={{ height: `${day.accuracy}%` }}
                        ></div>
                      </div>
                      <div className="text-xs font-semibold mt-1">{day.accuracy}%</div>
                      <div className="text-xs text-gray-400">{day.totalVotes}회</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'correct' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">내가 맞힌 콘텐츠 ({correctVotes.length}개)</h3>
              <div className="space-y-3">
                {correctVotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 맞힌 콘텐츠가 없습니다.
                  </div>
                ) : (
                  correctVotes.map(renderVoteItem)
                )}
              </div>
            </div>
          )}

          {tab === 'wrong' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">내가 틀린 콘텐츠 ({wrongVotes.length}개)</h3>
              <div className="space-y-3">
                {wrongVotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 틀린 콘텐츠가 없습니다.
                  </div>
                ) : (
                  wrongVotes.map(renderVoteItem)
                )}
              </div>
            </div>
          )}

          {tab === 'requested' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">내가 요청한 감별 콘텐츠 ({requestedReviews.length}개)</h3>
              <div className="space-y-3">
                {requestedReviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 감별을 요청한 콘텐츠가 없습니다.
                    <br />
                    <span className="text-sm">업로드 시 "감별 의뢰입니다"를 체크해보세요!</span>
                  </div>
                ) : (
                  requestedReviews.map((content: any) => (
                    <div key={content._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                        <img 
                          src={`http://localhost:5000${content.mediaUrl}`} 
                          alt={content.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(content.createdAt).toLocaleDateString('ko-KR')} • {content.totalVotes || 0}명 참여
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">감별 요청</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'badges' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">획득한 뱃지 ({badges.length}개)</h3>
              <div className="space-y-4">
                {badges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    아직 획득한 뱃지가 없습니다.
                    <br />
                    <span className="text-sm">투표를 통해 뱃지를 획득해보세요!</span>
                  </div>
                ) : (
                  badges.map(renderBadge)
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 