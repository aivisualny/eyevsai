"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { getMe, getMyVotes } from "@/lib/api";

export default function MyPage() {
  const [tab, setTab] = useState("accuracy");
  const [user, setUser] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const userData = await getMe();
        setUser(userData.user || userData);
        const voteData = await getMyVotes();
        setVotes(voteData.votes || voteData);
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

  // 투표 내역 분류
  const correct = votes.filter(v => v.isCorrect);
  const wrong = votes.filter(v => v.isCorrect === false);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        {/* 상단 프로필/점수/정답률/뱃지 */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
            {user.avatar ? <img src={user.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" /> : user.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold">{user.username}</div>
            <div className="text-gray-500 text-sm">누적 포인트 <b className="text-blue-600">{user.point || user.points || 0}pt</b></div>
            <div className="text-gray-500 text-sm">누적 정답률 <b className="text-green-600">{user.accuracy || 0}%</b></div>
          </div>
          <div className="ml-auto flex gap-2">
            {(user.badges || []).map((badge: string) => (
              <span key={badge} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">🏅 {badge}</span>
            ))}
          </div>
        </div>
        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 border-b pb-2">
          <button className={`px-4 py-2 font-semibold rounded-t ${tab === 'accuracy' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`} onClick={() => setTab('accuracy')}>정답률 분석</button>
          <button className={`px-4 py-2 font-semibold rounded-t ${tab === 'correct' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`} onClick={() => setTab('correct')}>내가 맞힌 콘텐츠</button>
          <button className={`px-4 py-2 font-semibold rounded-t ${tab === 'wrong' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`} onClick={() => setTab('wrong')}>내가 틀린 콘텐츠</button>
          <button className={`px-4 py-2 font-semibold rounded-t ${tab === 'badge' ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`} onClick={() => setTab('badge')}>획득한 뱃지</button>
        </div>
        {/* 탭 내용 */}
        <div>
          {tab === 'accuracy' && (
            <div className="text-center py-8">
              <div className="text-2xl font-bold mb-2">정답률 {user.accuracy || 0}%</div>
              <div className="text-gray-500">최근 30일간 정답률, 전체 정답률 등 상세 분석(추후 구현)</div>
            </div>
          )}
          {tab === 'correct' && (
            <div>
              <div className="font-semibold mb-2">내가 맞힌 콘텐츠</div>
              <ul className="space-y-2">
                {correct.length === 0 ? <li className="text-gray-400">없음</li> : correct.map((v) => (
                  <li key={v._id} className="flex items-center gap-2 p-2 border rounded">
                    <span className={`px-2 py-1 rounded text-xs text-white ${v.content?.isAI ? 'bg-blue-500' : 'bg-green-500'}`}>{v.content?.isAI ? 'AI' : 'Real'}</span>
                    <span>{v.content?.title || v.contentId}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'wrong' && (
            <div>
              <div className="font-semibold mb-2">내가 틀린 콘텐츠</div>
              <ul className="space-y-2">
                {wrong.length === 0 ? <li className="text-gray-400">없음</li> : wrong.map((v) => (
                  <li key={v._id} className="flex items-center gap-2 p-2 border rounded">
                    <span className={`px-2 py-1 rounded text-xs text-white ${v.content?.isAI ? 'bg-blue-500' : 'bg-green-500'}`}>{v.content?.isAI ? 'AI' : 'Real'}</span>
                    <span>{v.content?.title || v.contentId}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'badge' && (
            <div>
              <div className="font-semibold mb-2">획득한 뱃지</div>
              <div className="flex gap-2 flex-wrap">
                {(user.badges || []).length === 0 ? <span className="text-gray-400">없음</span> : (user.badges || []).map((badge: string) => (
                  <span key={badge} className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded text-sm font-semibold">🏅 {badge}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 