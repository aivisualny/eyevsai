"use client";
import React from "react";

const faqs = [
  {
    q: "정답은 언제 공개되나요?",
    a: "투표 마감 후 12시간이 지나면 정답이 공개됩니다. 정답 공개 시 전체 정답률과 생성앱 정보도 함께 확인할 수 있습니다.",
  },
  {
    q: "어떻게 포인트를 얻나요?",
    a: "투표에서 정답을 맞히면 +50pt, 틀리면 +10pt가 지급됩니다. 포인트는 랭킹, 뱃지 획득 등에 사용됩니다.",
  },
  {
    q: "정답은 어떻게 정해지나요?",
    a: "운영자 승인 또는 업로더가 직접 입력한 정답을 기준으로 하며, AI/실제/생성앱 정보가 함께 저장됩니다.",
  },
  {
    q: "생성앱 정보는 무엇인가요?",
    a: "Midjourney, Stable Diffusion, Runway 등 다양한 생성형 AI 도구로 만든 콘텐츠의 출처를 확인할 수 있습니다.",
  },
  {
    q: "정답률이란?",
    a: "전체 투표자 중 정답을 맞힌 비율을 의미합니다. 정답률이 낮을수록 더 헷갈리는 콘텐츠입니다.",
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">EyeVSAI 가이드 & FAQ</h1>
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">시스템 소개</h2>
          <p className="text-gray-700 mb-2">
            EyeVSAI는 AI 생성 콘텐츠와 실제 콘텐츠를 구분하는 커뮤니티 플랫폼입니다.<br />
            투표, 업로드, 랭킹, 포인트, 뱃지 등 다양한 기능을 통해 AI 감별력을 키워보세요!
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-4">자주 묻는 질문</h2>
          <ul className="space-y-6">
            {faqs.map((f: any, i: number) => (
              <li key={i}>
                <div className="font-bold text-blue-700 mb-1">Q. {f.q}</div>
                <div className="text-gray-700 pl-4">{f.a}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
} 