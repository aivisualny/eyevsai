'use client';

import { useState, useEffect } from 'react';
import { getContents, getMe, getRanking, getMyBadges, getGlobalStats, isTokenValid, refreshTokenIfNeeded } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export default function HomePage() {
  const [contents, setContents] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [ranking, setRanking] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [tab, setTab] = useState<string>('all');
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    loadContents();
    checkAuth();
    loadRanking();
    loadGlobalStats();
  }, [page, category, difficulty]);

  const loadContents = async () => {
    try {
      const data = await getContents({ page, limit: 10, category, difficulty });
      setContents(data.contents);
    } catch (error: any) {
      console.error('콘텐츠 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 먼저 토큰 갱신 시도
        const tokenRefreshed = await refreshTokenIfNeeded();
        
        if (tokenRefreshed && isTokenValid()) {
          const [userData, badgesData] = await Promise.all([
            getMe(),
            getMyBadges().catch(() => ({ badges: [] }))
          ]);
          setUser(userData.user);
          setUserBadges(badgesData.badges || []);
        } else {
          // 유효하지 않은 토큰 제거
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error: any) {
      console.error('인증 체크 오류:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const loadRanking = async () => {
    try {
      const data = await getRanking();
      setRanking(data.ranking || []);
    } catch (e: any) {}
  };

  const loadGlobalStats = async () => {
    try {
      const data = await getGlobalStats();
      setGlobalStats(data);
    } catch (e: any) {
      console.error('전체 통계 로드 실패:', e);
    }
  };

  useEffect(() => {
    async function fetchContents() {
      setLoading(true);
      setError('');
      try {
        const data = await getContents();
        setContents(data.contents || []);
      } catch (e: any) {
        setError('콘텐츠를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchContents();
  }, []);

  function filteredContents(tab: any, contents: any[]) {
    if (tab === 'all') return contents;
    if (tab === 'progress') return contents.filter(c => c.status !== 'closed');
    if (tab === 'closed') return contents.filter(c => c.status === 'closed');
    if (tab === 'requested') return contents.filter(c => c.isRequestedReview === true);
    return contents;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* 히어로 영역 */}
        <section className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <span className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center text-4xl mx-auto">👁️</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">당신의 눈은 AI보다 정확한가?</h1>
            <p className="text-lg md:text-xl mb-8">AI로 생성된 콘텐츠와 실제 콘텐츠를 구분하는 감별 커뮤니티에 참여하세요. 당신의 판단이 AI 기술 발전에 기여합니다.</p>
            
            {/* 사용자 뱃지 표시 */}
            {user && userBadges.length > 0 && (
              <div className="mb-6">
                <div className="text-sm text-blue-100 mb-2">내 뱃지</div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {userBadges.slice(0, 5).map((badge: any, index: number) => (
                    <div key={index} className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-sm">
                      {badge.badge?.icon} {badge.badge?.name}
                    </div>
                  ))}
                  {userBadges.length > 5 && (
                    <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-sm">
                      +{userBadges.length - 5}개 더
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
              <Button onClick={() => window.location.href = '/vote'} className="w-full md:w-auto text-lg md:text-xl py-4 px-8 font-bold shadow-lg bg-blue-600 text-white border-2 border-blue-600 hover:bg-white hover:text-blue-700 transition-all rounded-xl">
                투표 시작하기
              </Button>
              <Button onClick={() => window.location.href = '/guide'} variant="outline" className="w-full md:w-auto text-lg md:text-xl py-4 px-8 font-bold shadow-lg border-2 border-white text-white hover:bg-white hover:text-blue-700 transition-all rounded-xl">
                AI 탐지란?
              </Button>
            </div>
          </div>
        </section>

        {/* 통계 영역 */}
        <section className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-10 px-4">
          <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow hover:shadow-lg transition-all">
            <span className="text-3xl mb-2">👤</span>
            <span className="text-2xl font-bold text-blue-700 mb-1">{globalStats?.totalUsers?.toLocaleString() || '0'}</span>
            <span className="text-gray-600 text-sm">참여자</span>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow hover:shadow-lg transition-all">
            <span className="text-3xl mb-2">✅</span>
            <span className="text-2xl font-bold text-blue-700 mb-1">{globalStats?.totalVotes?.toLocaleString() || '0'}</span>
            <span className="text-gray-600 text-sm">총 투표</span>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow hover:shadow-lg transition-all">
            <span className="text-3xl mb-2">⬆️</span>
            <span className="text-2xl font-bold text-blue-700 mb-1">{globalStats?.totalContents?.toLocaleString() || '0'}</span>
            <span className="text-gray-600 text-sm">업로드된 콘텐츠</span>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow hover:shadow-lg transition-all">
            <span className="text-3xl mb-2">🏆</span>
            <span className="text-2xl font-bold text-blue-700 mb-1">{globalStats?.averageAccuracy || '0'}%</span>
            <span className="text-gray-600 text-sm">평균 정확도</span>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 콘텐츠 영역 */}
            <div className="lg:col-span-2">
              {/* 오늘의 콘텐츠 */}
              <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🔥</span>
                  <h2 className="text-xl font-bold">오늘의 인기 콘텐츠</h2>
                </div>
                {contents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-500 mb-4">아직 업로드된 콘텐츠가 없습니다</p>
                    <Button 
                      onClick={() => window.location.href = '/upload'} 
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      첫 콘텐츠 업로드하기
                    </Button>
                  </div>
                ) : (
                  contents.slice(0, 3).map((c: any) => (
                    <div key={c._id} className="flex items-center gap-4 p-3 border rounded-lg mb-3 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/vote/${c._id}`}>
                      <div className="relative">
                        <img src={c.mediaUrl.startsWith('data:') ? c.mediaUrl : c.mediaUrl.startsWith('http') ? c.mediaUrl : `https://eyevsai.onrender.com${c.mediaUrl}`} alt={c.title} className="w-16 h-16 object-cover rounded" />
                        {c.isRecycled && (
                          <span className="absolute top-1 left-1 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded font-semibold shadow">🔁 재투표</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                          {c.isRequestedReview && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-1 py-0.5 rounded font-semibold shadow">🔍 감별 요청</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{c.totalVotes || 0}명 참여</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{c.totalVotes ? Math.round((c.votes?.real || 0) / c.totalVotes * 100) : 0}%</div>
                        <div className="text-xs text-gray-500">Real 비율</div>
                      </div>
                    </div>
                  ))
                )}
              </section>

              {/* 투표 카드 리스트 */}
              <section className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">투표하기</h2>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold border-2 shadow transition-all ${tab === 'all' ? 'text-blue-700 bg-blue-100 border-blue-400' : 'text-blue-700 bg-white border-blue-200 hover:bg-blue-50'}`}
                      onClick={() => setTab('all')}
                      title="모든 투표 보기"
                    >전체</button>
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold border-2 shadow transition-all ${tab === 'progress' ? 'text-green-700 bg-green-100 border-green-400' : 'text-green-700 bg-white border-green-200 hover:bg-green-50'}`}
                      onClick={() => setTab('progress')}
                      title="아직 투표 가능한 콘텐츠만 보기"
                    >진행중</button>
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold border-2 shadow transition-all ${tab === 'closed' ? 'text-gray-700 bg-gray-100 border-gray-400' : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setTab('closed')}
                      title="투표가 마감된 콘텐츠만 보기"
                    >마감됨</button>
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold border-2 shadow transition-all ${tab === 'requested' ? 'text-yellow-700 bg-yellow-100 border-yellow-400' : 'text-yellow-700 bg-white border-yellow-200 hover:bg-yellow-50'}`}
                      onClick={() => setTab('requested')}
                      title="감별 의뢰된 콘텐츠만 보기"
                    >감별 의뢰</button>
                  </div>
                </div>
                {loading ? (
                  <div className="text-center text-gray-500 py-12">로딩 중...</div>
                ) : error ? (
                  <div className="text-center text-red-500 py-12">{error}</div>
                ) : filteredContents(tab, contents).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📸</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {tab === 'all' ? '아직 콘텐츠가 없습니다' : 
                       tab === 'progress' ? '진행 중인 투표가 없습니다' :
                       tab === 'closed' ? '마감된 투표가 없습니다' :
                       '감별 의뢰된 콘텐츠가 없습니다'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {tab === 'all' ? '첫 번째 콘텐츠를 업로드해보세요!' :
                       tab === 'progress' ? '새로운 투표를 기다려주세요' :
                       tab === 'closed' ? '마감된 투표 결과를 확인해보세요' :
                       '감별이 필요한 콘텐츠를 업로드해보세요'}
                    </p>
                    {tab === 'all' && (
                      <Button 
                        onClick={() => window.location.href = '/upload'} 
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                      >
                        콘텐츠 업로드하기
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredContents(tab, contents).map((c: any) => (
                      <div key={c._id} className="rounded-xl border shadow-lg p-4 bg-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => window.location.href = `/vote/${c._id}`}>
                        <div className="relative mb-3 group">
                          <img src={c.mediaUrl.startsWith('data:') ? c.mediaUrl : c.mediaUrl.startsWith('http') ? c.mediaUrl : `https://eyevsai.onrender.com${c.mediaUrl}`} alt={c.title} className="rounded-lg w-full h-48 object-cover group-hover:scale-105 group-hover:shadow-xl transition-transform duration-200" />
                          {c.status === 'closed' && <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">마감됨</span>}
                          {c.isAnswerRevealed && <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">정답 공개됨</span>}
                          {c.isRecycled && (
                            <span className="absolute top-2 left-2 bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded font-semibold shadow">♻️ 재투표</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold truncate">{c.title}</h3>
                          {c.isRequestedReview && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-semibold shadow">🔍 감별 요청</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mb-2 line-clamp-2">{c.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <span>{c.status === 'closed' ? '마감됨' : '진행중'}</span>
                          <span>·</span>
                          <span>{c.totalVotes || 0}명 참여</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-green-600 font-bold text-sm">Real</span>
                            <span className="text-gray-500 text-xs">결과</span>
                          </div>
                          <div className="flex w-full h-8 rounded overflow-hidden text-xs font-semibold">
                            <div className="bg-green-100 text-green-700 flex items-center justify-center min-w-0 px-1" style={{ width: `${c.totalVotes ? Math.round((c.votes?.real || 0) / c.totalVotes * 100) : 0}%` }}>
                              {c.totalVotes ? Math.round((c.votes?.real || 0) / c.totalVotes * 100) : 0}%
                            </div>
                            <div className="bg-red-100 text-red-700 flex items-center justify-center min-w-0 px-1" style={{ width: `${c.totalVotes ? Math.round((c.votes?.ai || 0) / c.totalVotes * 100) : 0}%` }}>
                              {c.totalVotes ? Math.round((c.votes?.ai || 0) / c.totalVotes * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 정답률 랭킹 */}
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">🏆 정답률 랭킹</h2>
                {ranking.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-gray-500 text-sm">아직 랭킹 데이터가 없습니다</p>
                    <p className="text-gray-400 text-xs mt-1">투표에 참여해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ranking.slice(0, 10).map((user: any, index: number) => (
                      <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => window.location.href = `/ranking`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.totalVotes}표</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">{user.accuracy}%</div>
                          <div className="text-xs text-gray-500">{user.points}pt</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  onClick={() => window.location.href = '/ranking'} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  전체 랭킹 보기
                </Button>
              </section>

              {/* 내 통계 (로그인한 경우) */}
              {user && (
                <section className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4">👤 내 통계</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 투표</span>
                      <span className="font-semibold">{user.totalVotes || 0}회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">정답률</span>
                      <span className="font-semibold text-green-600">{user.accuracy || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">포인트</span>
                      <span className="font-semibold text-blue-600">{user.points || 0}pt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">뱃지</span>
                      <span className="font-semibold text-yellow-600">{userBadges.length}개</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/mypage'} 
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    마이페이지
                  </Button>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 