import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

// 목업 데이터 예시
const mockData = [
  {
    id: '1',
    title: 'Midjourney Art #1',
    userVote: 'REAL',
    aiDetectionResult: 'FAKE',
    aiConfidence: 0.92,
    detectionModel: 'microsoft/beit-base',
  },
  {
    id: '2',
    title: '사진 #2',
    userVote: 'FAKE',
    aiDetectionResult: 'FAKE',
    aiConfidence: 0.81,
    detectionModel: 'yuvalkirstain/PickScore',
  },
  {
    id: '3',
    title: 'Midjourney Art #3',
    userVote: 'REAL',
    aiDetectionResult: 'REAL',
    aiConfidence: 0.77,
    detectionModel: 'microsoft/beit-base',
  },
];

export default function AIDetectionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">AI 탐지 결과 로그</h1>
      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4">콘텐츠</th>
              <th className="py-2 px-4">유저 투표</th>
              <th className="py-2 px-4">AI 탐지 결과</th>
              <th className="py-2 px-4">AI 신뢰도</th>
              <th className="py-2 px-4">탐지 모델</th>
              <th className="py-2 px-4">비교</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 px-4 font-medium">{row.title}</td>
                <td className="py-2 px-4">{row.userVote}</td>
                <td className="py-2 px-4">{row.aiDetectionResult}</td>
                <td className="py-2 px-4">{row.aiConfidence != null ? `${(row.aiConfidence * 100).toFixed(1)}%` : '-'}</td>
                <td className="py-2 px-4">{row.detectionModel || '-'}</td>
                <td className="py-2 px-4">
                  {row.userVote === row.aiDetectionResult ? (
                    <span className="text-green-600 font-semibold">일치</span>
                  ) : (
                    <span className="text-red-600 font-semibold">불일치</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-6 text-gray-500 text-xs">※ 실제 데이터 연동은 추후 구현 예정</div>
    </div>
  );
} 