'use client';

import { useState, useEffect } from 'react';

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export const TagSelector = ({ value, onChange, placeholder = "태그를 선택하거나 입력하세요", maxTags = 10 }: TagSelectorProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // 기본 태그 옵션들
  const defaultTags = [
    'AI아트', '사진', '그림', '디자인', '풍경', '인물', '추상', '현대', '고전',
    '디지털아트', '전통', '미니멀', '컬러풀', '흑백', '야경', '도시', '자연',
    '건축', '음식', '패션', '스포츠', '동물', '식물', '기하학', '유기적'
  ];

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // 입력값 변경 시 제안 목록 업데이트
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = defaultTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) && 
        !value.includes(tag)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions(defaultTags.filter(tag => !value.includes(tag)).slice(0, 5));
    }
  }, [inputValue, value]);

  // 엔터키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  // 태그 색상 생성
  const getTagColor = (tag: string) => {
    const colors = [
      'bg-purple-600', 'bg-green-600', 'bg-blue-600', 'bg-red-600', 
      'bg-yellow-600', 'bg-pink-600', 'bg-indigo-600', 'bg-gray-600'
    ];
    const index = tag.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative">
      {/* 선택된 태그들 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((tag, index) => (
          <span
            key={index}
            className={`${getTagColor(tag)} text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={() => removeTag(tag)}
          >
            {tag}
            <span className="text-xs">×</span>
          </span>
        ))}
      </div>

      {/* 입력 필드 */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={value.length >= maxTags ? `최대 ${maxTags}개까지 선택 가능` : placeholder}
          disabled={value.length >= maxTags}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        
        {/* 제안 목록 */}
        {isOpen && (suggestions.length > 0 || inputValue.trim()) && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
            {/* 입력한 값으로 새 태그 생성 */}
            {inputValue.trim() && !value.includes(inputValue.trim()) && !suggestions.includes(inputValue.trim()) && (
              <div
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                onClick={() => addTag(inputValue)}
              >
                <span className="text-green-600">+</span>
                <span>"{inputValue.trim()}" 생성</span>
              </div>
            )}
            
            {/* 제안된 태그들 */}
            {suggestions.map((tag, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                onClick={() => addTag(tag)}
              >
                <span className={`w-3 h-3 rounded-full ${getTagColor(tag)}`}></span>
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 태그 개수 표시 */}
      <div className="text-xs text-gray-500 mt-1">
        {value.length}/{maxTags}개 선택됨
      </div>
    </div>
  );
}; 