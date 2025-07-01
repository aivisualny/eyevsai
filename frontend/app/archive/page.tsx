"use client";
import React, { useEffect, useState } from "react";
import { getContents } from "@/lib/api";

const apps = [
  { key: "all", name: "전체" },
  // 실제 데이터에서 generator 종류를 동적으로 추출할 수도 있음
];

export default function ArchivePage() {
  const [tab, setTab] = useState("all");
  const [contents, setContents] = useState<any[]>([]);
  const [generators, setGenerators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchContents() {
      setLoading(true);
      setError("");
      try {
        const data = await getContents();
        const list = data.contents || [];
        setContents(list);
        // generator 종류 추출
        const gens = Array.from(new Set(list.map((c: any) => c.generator).filter(Boolean)));
        setGenerators(gens as string[]);
      } catch (e) {
        setError("콘텐츠를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchContents();
  }, []);

  // 탭 목록 동적 생성
  const tabList = [
    { key: "all", name: "전체" },
    ...generators.map(g => ({ key: g, name: g })),
  ];

  // 필터링
  const filtered = tab === "all" ? contents : contents.filter(c => c.generator === tab);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">생성앱별 콘텐츠 아카이브</h1>
        {/* 앱별 탭 */}
        <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
          {tabList.map(app => (
            <button
              key={app.key}
              className={`px-4 py-2 font-semibold rounded-t whitespace-nowrap ${tab === app.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}
              onClick={() => setTab(app.key)}
            >
              {app.name}
            </button>
          ))}
        </div>
        {/* 콘텐츠 리스트 */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12">표시할 콘텐츠가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((c) => (
              <div key={c._id} className="border rounded-lg p-4 bg-gray-50">
                <img src={c.mediaUrl?.startsWith('http') ? c.mediaUrl : `http://localhost:5000${c.mediaUrl}`} alt={c.title} className="rounded w-full h-40 object-cover mb-3" />
                <div className="font-semibold mb-1">{c.title}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700 font-bold">정답률 {c.answerRate || 0}%</span>
                  {c.answerRate !== undefined && c.answerRate < 50 && (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">많이 틀림!</span>
                  )}
                  {c.generator && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{c.generator}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 