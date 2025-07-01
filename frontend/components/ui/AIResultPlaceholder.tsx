import React from 'react';
import { Card } from './Card';

export default function AIResultPlaceholder() {
  return (
    <Card className="mb-4 bg-blue-50 border-blue-200 text-blue-900">
      <div className="flex flex-col items-center py-6">
        <span className="font-semibold text-lg mb-2">AI 탐지 결과 보기 (곧 공개 예정!)</span>
        <span className="text-sm text-blue-700">AI 분석 결과: 잠시 후 제공됩니다</span>
      </div>
    </Card>
  );
} 