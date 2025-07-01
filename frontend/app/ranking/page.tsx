"use client";
import React, { useEffect, useState } from "react";
import { getRanking, getMe, followUser, unfollowUser } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type SortType = 'accuracy' | 'points' | 'votes';

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sortType, setSortType] = useState<SortType>('accuracy');
  const [me, setMe] = useState<any>(null);
  const [followings, setFollowings] = useState<string[]>([]);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [rankingData, meData] = await Promise.all([
          getRanking(),
          getMe().catch(() => null)
        ]);
        setRanking(rankingData.ranking || rankingData);
        if (meData && meData.user) {
          setMe(meData.user);
          setFollowings(meData.user.following?.map((u: any) => u.id || u._id) || []);
        }
      } catch (e) {
        setError("랭킹 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    setFollowLoading(userId);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setFollowings(followings.filter((id) => id !== userId));
      } else {
        await followUser(userId);
        setFollowings([...followings, userId]);
      }
    } catch (e) {
      alert('팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setFollowLoading(null);
    }
  };

  const sortedRanking = [...ranking].sort((a, b) => {
    switch (sortType) {
      case 'accuracy':
        return (b.accuracy || 0) - (a.accuracy || 0);
      case 'points':
        return (b.points || 0) - (a.points || 0);
      case 'votes':
        return (b.totalVotes || 0) - (a.totalVotes || 0);
      default:
        return 0;
    }
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300';
    if (index === 1) return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
    if (index === 2) return 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-300';
    return 'bg-white border-gray-200';
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 정답률 랭킹</h1>
          <p className="text-gray-600">AI 감별 능력을 겨루는 최고의 플레이어들</p>
        </div>

        {/* 정렬 옵션 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setSortType('accuracy')}
              variant={sortType === 'accuracy' ? 'default' : 'outline'}
              className="px-6"
            >
              정답률 순
            </Button>
            <Button
              onClick={() => setSortType('points')}
              variant={sortType === 'points' ? 'default' : 'outline'}
              className="px-6"
            >
              포인트 순
            </Button>
            <Button
              onClick={() => setSortType('votes')}
              variant={sortType === 'votes' ? 'default' : 'outline'}
              className="px-6"
            >
              투표 수 순
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : ranking.length === 0 ? (
          <div className="text-center text-gray-400 py-12">랭킹 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-6">
            {/* TOP 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedRanking.slice(0, 3).map((user: any, index: number) => (
                <div key={user._id} className={`${getRankColor(index)} border-2 rounded-xl p-6 text-center`}>
                  <div className="text-4xl mb-2">{getRankIcon(index)}</div>
                  <div className="text-xl font-bold mb-2">{user.username}</div>
                  <div className="space-y-1 text-sm">
                    <div className="text-green-600 font-semibold">정답률 {user.accuracy || 0}%</div>
                    <div className="text-blue-600">포인트 {user.points || 0}pt</div>
                    <div className="text-gray-600">투표 {user.totalVotes || 0}회</div>
                  </div>
                  {user.badges && user.badges.length > 0 && (
                    <div className="mt-3 flex justify-center gap-1 flex-wrap">
                      {user.badges.slice(0, 3).map((badge: any, badgeIndex: number) => (
                        <span key={badgeIndex} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                          {badge.badge?.icon || '🏅'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 전체 랭킹 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">전체 랭킹</h2>
              <div className="space-y-3">
                {sortedRanking.map((user: any, index: number) => {
                  const userId = user.id || user._id;
                  const isMe = me && (me.id === userId || me._id === userId);
                  const isFollowing = followings.includes(userId);
                  return (
                    <div key={userId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.totalVotes || 0}표 • {user.correctVotes || 0}정답
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{user.accuracy || 0}%</div>
                        <div className="text-sm text-blue-600">{user.points || 0}pt</div>
                      </div>
                      <div className="flex gap-1">
                        {user.badges && user.badges.slice(0, 2).map((badge: any, badgeIndex: number) => (
                          <span key={badgeIndex} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                            {badge.badge?.icon || '🏅'}
                          </span>
                        ))}
                        {user.badges && user.badges.length > 2 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            +{user.badges.length - 2}
                          </span>
                        )}
                      </div>
                      {/* 팔로우/언팔로우 버튼 */}
                      {me && !isMe && (
                        <Button
                          variant={isFollowing ? 'outline' : 'default'}
                          className="ml-2 min-w-[80px]"
                          disabled={followLoading === userId}
                          onClick={() => handleFollow(userId, isFollowing)}
                        >
                          {followLoading === userId
                            ? '처리중...'
                            : isFollowing
                              ? '언팔로우'
                              : '팔로우'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 최근 급상승 유저 (가상 데이터) */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">📈 최근 급상승 유저</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { username: 'AI탐정가', accuracy: 85, change: '+15%' },
                  { username: '정답왕', accuracy: 92, change: '+8%' },
                  { username: '새로운도전자', accuracy: 78, change: '+12%' }
                ].map((user, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-green-600 font-bold">{user.change}</div>
                    </div>
                    <div className="text-sm text-gray-600">정답률 {user.accuracy}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 