'use client';

import { useState, useEffect } from 'react';
import { getContents, getMe, getRanking } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import Header from '../components/ui/Header';

// 통계 mock 데이터 (실제 API 연동 시 교체)
const stats = [
  { icon: '👤', label: '참여자', value: '12,847' },
  { icon: '✅', label: '총 투표', value: '89,234' },
  { icon: '⬆️', label: '업로드된 콘텐츠', value: '1,234' },
  { icon: '🏆', label: '평균 정확도', value: '67.8%' },
];

export default function HomePage() {
  const [contents, setContents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContents();
    checkAuth();
    loadRanking();
  }, [page, category, difficulty]);

  const loadContents = async () => {
    try {
      const data = await getContents({ page, limit: 10, category, difficulty });
      setContents(data.contents);
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error);
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
    } catch (error) {
      localStorage.removeItem('token');
    }
  };

  const loadRanking = async () => {
    try {
      const data = await getRanking();
      setRanking(data.ranking);
    } catch (e) {}
  };

  useEffect(() => {
    async function fetchContents() {
      setLoading(true);
      setError('');
      try {
        const data = await getContents();
        setContents(data.contents || []);
      } catch (e) {
        setError('콘텐츠를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchContents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <Header user={null} onLogout={() => {}} onWithdraw={() => {}} />
      <main className="min-h-screen bg-gray-50">
        {/* 히어로 영역 */}
        <section className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <span className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center text-4xl mx-auto">👁️</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">당신의 눈은 AI보다 정확한가?</h1>
            <p className="text-lg md:text-xl mb-8">AI로 생성된 콘텐츠와 실제 콘텐츠를 구분하는 감별 커뮤니티에 참여하세요. 당신의 판단이 AI 기술 발전에 기여합니다.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
              <Button onClick={() => window.location.href = '/vote'} className="w-full md:w-auto text-lg md:text-xl py-4 px-8 font-bold shadow-lg bg-white text-blue-700 border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all rounded-xl">
                투표 시작하기
              </Button>
              <Button onClick={() => window.location.href = '/upload'} variant="outline" className="w-full md:w-auto text-lg md:text-xl py-4 px-8 font-bold shadow-lg border-2 border-white text-white hover:bg-white hover:text-blue-700 transition-all rounded-xl">
                콘텐츠 업로드
              </Button>
            </div>
          </div>
        </section>

        {/* 통계 영역 */}
        <section className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-10 px-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center bg-blue-50 rounded-lg p-4">
              <span className="text-2xl font-bold text-blue-700 mb-1">{s.value}</span>
              <span className="text-gray-600 text-sm">{s.label}</span>
            </div>
          ))}
        </section>

        {/* 투표 카드 리스트 */}
        <section className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">투표하기</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 border-2 border-blue-400 shadow hover:bg-blue-200 transition-all" title="모든 투표 보기">전체</button>
              <button className="px-4 py-2 rounded-lg font-semibold text-green-700 bg-green-100 border-2 border-green-400 shadow hover:bg-green-200 transition-all" title="아직 투표 가능한 콘텐츠만 보기">진행중</button>
              <button className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 border-2 border-gray-400 shadow hover:bg-gray-200 transition-all" title="투표가 마감된 콘텐츠만 보기">마감됨</button>
            </div>
          </div>
          {loading ? (
            <div className="text-center text-gray-500 py-12">로딩 중...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : contents.length === 0 ? (
            <div className="text-center text-gray-400 py-12">표시할 콘텐츠가 없습니다.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {contents.map((c) => (
                <div key={c._id} className="rounded-xl border shadow-lg p-6 bg-gray-50 hover:shadow-2xl transition-all">
                  <div className="relative mb-4 group">
                    <img src={c.mediaUrl.startsWith('http') ? c.mediaUrl : `http://localhost:5000${c.mediaUrl}`} alt={c.title} className="rounded-lg w-full h-64 object-cover group-hover:scale-105 group-hover:shadow-xl transition-transform duration-200" />
                    {c.status === 'closed' && <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">마감됨</span>}
                    {c.isAnswerRevealed && <span className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">정답 공개됨</span>}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{c.title}</h3>
                  <p className="text-gray-500 text-sm mb-2">{c.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span>{c.status === 'closed' ? '마감됨' : '진행중'}</span>
                    <span>·</span>
                    <span>{c.totalVotes || 0}명 참여</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-600 font-bold" title="투표자 중 Real(실제)로 판별한 비율입니다.">Real <span className="align-middle text-xs ml-1">ⓘ</span></span>
                      <span className="text-gray-500" title="이 콘텐츠의 투표 결과입니다.">결과 <span className="align-middle text-xs ml-1">ⓘ</span></span>
                    </div>
                    <div className="flex w-full h-6 rounded overflow-hidden text-xs font-semibold">
                      <div className="bg-green-100 text-green-700 flex items-center justify-center" style={{ width: `${c.totalVotes ? Math.round((c.votes?.real || 0) / c.totalVotes * 100) : 0}%` }}>
                        {c.totalVotes ? Math.round((c.votes?.real || 0) / c.totalVotes * 100) : 0}%
                      </div>
                      <div className="bg-red-100 text-red-700 flex items-center justify-center" style={{ width: `${c.totalVotes ? Math.round((c.votes?.ai || 0) / c.totalVotes * 100) : 0}%` }}>
                        {c.totalVotes ? Math.round((c.votes?.ai || 0) / c.totalVotes * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
} 