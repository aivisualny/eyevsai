"use client";
import React, { useEffect, useState } from "react";
import { getContents, getMyVoteStats } from "@/lib/api";
import { VoteStats } from "@/types/content";

export default function StatsPage() {
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [appStats, setAppStats] = useState<any[]>([]);
  const [difficultContents, setDifficultContents] = useState<any[]>([]);
  const [personalStats, setPersonalStats] = useState<VoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiStats, setAIStats] = useState<any[]>([{
    model: 'microsoft/beit-base',
    app: 'Midjourney',
    accuracy: 83.2,
    sample: 120
  }, {
    model: 'yuvalkirstain/PickScore',
    app: '사진',
    accuracy: 76.5,
    sample: 80
  }]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError("");
      try {
        // 전역 통계와 개인 통계를 병렬로 가져오기
        const [contentsData, personalData] = await Promise.all([
          getContents(),
          getMyVoteStats().catch(() => null) // 로그인하지 않은 경우 무시
        ]);
        
        const contents = contentsData.contents || [];
        
        // 전체 통계 집계
        const totalVotes = contents.reduce((sum: number, c: any) => sum + (c.totalVotes || 0), 0);
        const totalAccuracy = contents.length ? 
          Math.round(contents.reduce((sum: number, c: any) => sum + (c.answerRate || 0), 0) / contents.length * 10) / 10 : 0;
        const totalUploads = contents.length;
        
        // 앱별 통계 집계
        const appMap: Record<string, { app: string; accuracy: number; uploads: number; sum: number; }> = {};
        contents.forEach((c: any) => {
          const app = c.generator || c.aiTool || '기타';
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
        
        // 어려운 콘텐츠 (정답률 낮은 순)
        const difficultContentsArr = contents
          .filter((c: any) => c.totalVotes >= 5) // 최소 5표 이상
          .sort((a: any, b: any) => (a.answerRate || 0) - (b.answerRate || 0))
          .slice(0, 10);
        
        setGlobalStats({
          "전체 정답률": `${totalAccuracy}%`,
          "총 투표 수": totalVotes.toLocaleString(),
          "업로드된 콘텐츠": totalUploads,
          "평균 난이도": "보통"
        });
        
        setAppStats(appStatsArr);
        setDifficultContents(difficultContentsArr);
        setPersonalStats(personalData);
        
      } catch (e) {
        setError("통계 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const renderAccuracyChart = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    const maxAccuracy = Math.max(...data.map(d => d.accuracy));
    
    return (
      <div className="space-y-2">
        {data.map((day, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-xs text-gray-500">
              {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
              <div 
                className="bg-green-500 rounded-full h-3 transition-all duration-500"
                style={{ width: `${(day.accuracy / maxAccuracy) * 100}%` }}
              ></div>
            </div>
            <div className="w-12 text-xs font-semibold text-right">{day.accuracy}%</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">📊 통계 대시보드</h1>
        
        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : !globalStats ? (
          <div className="text-center text-gray-400 py-12">통계 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-8">
            {/* 전체 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(globalStats).map(([label, value]) => (
                <div key={label} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
                  <div className="text-gray-600 text-sm">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 개인 통계 */}
              {personalStats && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4">👤 내 통계</h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{personalStats.totalVotes}</div>
                      <div className="text-sm text-gray-600">총 투표</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{personalStats.accuracy}%</div>
                      <div className="text-sm text-gray-600">정답률</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3">최근 7일 정답률</h3>
                  {renderAccuracyChart(personalStats.last7Days)}
                </div>
              )}

              {/* 앱별 통계 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">🤖 생성앱별 통계</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">앱</th>
                        <th className="text-center py-2 font-semibold">정답률</th>
                        <th className="text-center py-2 font-semibold">업로드</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appStats.map(app => (
                        <tr key={app.app} className="border-b">
                          <td className="py-2 font-medium">{app.app}</td>
                          <td className="py-2 text-center">
                            <span className={`font-bold ${
                              app.accuracy >= 70 ? 'text-green-600' : 
                              app.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {app.accuracy}%
                            </span>
                          </td>
                          <td className="py-2 text-center text-gray-600">{app.uploads}개</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 어려운 콘텐츠 TOP 10 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">🔥 가장 어려운 콘텐츠 TOP 10</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {difficultContents.map((content, index) => (
                  <div key={content.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm truncate">{content.title}</div>
                        <div className="text-xs text-gray-500">{content.generator || content.aiTool || '기타'}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-600">
                        {content.totalVotes}표
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        {content.answerRate || 0}% 정답률
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {difficultContents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  아직 충분한 투표 데이터가 없습니다.
                </div>
              )}
            </div>

            {/* AI 탐지기 통계 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">🤖 AI 탐지기 정확도</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">모델</th>
                      <th className="text-center py-2 font-semibold">적용 콘텐츠</th>
                      <th className="text-center py-2 font-semibold">탐지 성공률</th>
                      <th className="text-center py-2 font-semibold">샘플 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiStats.map(ai => (
                      <tr key={ai.model} className="border-b">
                        <td className="py-2 font-medium">{ai.model}</td>
                        <td className="py-2 text-center">{ai.app}</td>
                        <td className="py-2 text-center font-bold text-blue-600">{ai.accuracy}%</td>
                        <td className="py-2 text-center text-gray-600">{ai.sample}개</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-gray-500">※ 실제 AI 탐지기 연동 및 통계는 추후 실데이터로 대체됩니다.</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 