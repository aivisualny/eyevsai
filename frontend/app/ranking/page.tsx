"use client";
import React, { useEffect, useState } from "react";
import { getRanking } from "@/lib/api";

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      setError("");
      try {
        const data = await getRanking();
        setRanking(data.ranking || data);
      } catch (e) {
        setError("랭킹 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">정답률 랭킹 TOP 10</h1>
        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : ranking.length === 0 ? (
          <div className="text-center text-gray-400 py-12">랭킹 데이터가 없습니다.</div>
        ) : (
          <ol className="space-y-2">
            {ranking.slice(0, 10).map((user, i) => (
              <li key={user._id || user.username} className={`flex items-center gap-4 p-3 rounded ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <span className={`font-bold text-xl w-8 text-center ${i < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>{i + 1}</span>
                <span className="flex-1 font-semibold">{user.username}</span>
                <span className="text-blue-700 font-bold">{user.points || user.point || 0}pt</span>
                <span className="text-green-600 font-semibold">{user.accuracy || 0}%</span>
                <span className="flex gap-1">
                  {(user.badges || []).map((badge: string) => (
                    <span key={badge} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">🏅 {badge}</span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
} 