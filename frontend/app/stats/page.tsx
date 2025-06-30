"use client";
import React, { useEffect, useState } from "react";
import { getContents } from "@/lib/api";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [appStats, setAppStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError("");
      try {
        // 실제 통계 API가 없으므로 getContents로 집계
        const data = await getContents();
        const contents = data.contents || [];
        // 전체 통계 집계
        const totalVotes = contents.reduce((sum, c) => sum + (c.totalVotes || 0), 0);
        const totalAccuracy = contents.length ? Math.round(contents.reduce((sum, c) => sum + (c.answerRate || 0), 0) / contents.length * 10) / 10 : 0;
        const totalUploads = contents.length;
        // 앱별 통계 집계
        const appMap: Record<string, { app: string; accuracy: number; uploads: number; sum: number; }> = {};
        contents.forEach(c => {
          const app = c.generator || '기타';
          if (!appMap[app]) appMap[app] = { app, accuracy: 0, uploads: 0, sum: 0 };
          appMap[app].uploads += 1;
          appMap[app].accuracy += c.answerRate || 0;
          appMap[app].sum += 1;
        });
        const appStatsArr = Object.values(appMap).map(a => ({
          app: a.app,
          accuracy: a.sum ? Math.round((a.accuracy / a.sum) * 10) / 10 : 0,
          uploads: a.uploads,
        }));
        setStats({
          "전체 정답률": `${totalAccuracy}%`,
          "총 투표 수": totalVotes,
          "업로드된 콘텐츠": totalUploads,
        });
        setAppStats(appStatsArr);
      } catch (e) {
        setError("통계 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">통계</h1>
        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : !stats ? (
          <div className="text-center text-gray-400 py-12">통계 데이터가 없습니다.</div>
        ) : (
          <>
            {/* 전체 통계 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {Object.entries(stats).map(([label, value]) => (
                <div key={label} className="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
                  <span className="text-2xl font-bold text-blue-700 mb-1">{value}</span>
                  <span className="text-gray-600 text-sm">{label}</span>
                </div>
              ))}
            </div>
            {/* 앱별 정답률/업로드 */}
            <h2 className="text-lg font-semibold mb-4 mt-8">생성앱별 정답률 & 업로드 분포</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-center border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">앱/방식</th>
                    <th className="px-4 py-2">정답률</th>
                    <th className="px-4 py-2">업로드 수</th>
                  </tr>
                </thead>
                <tbody>
                  {appStats.map(app => (
                    <tr key={app.app}>
                      <td className="px-4 py-2 font-semibold">{app.app}</td>
                      <td className="px-4 py-2 text-blue-700 font-bold">{app.accuracy}%</td>
                      <td className="px-4 py-2">{app.uploads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
} 