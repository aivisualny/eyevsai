'use client';

import { useState, useEffect } from 'react';
import { uploadContent, getMe, analyzeContentAI } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export default function UploadPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    category: 'other',
    difficulty: 'medium',
    tags: '',
    isAI: 'false',
    isRequestedReview: false
  });
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
      }
      const data = await getMe();
      setUser(data.user);
    } catch (error: any) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    if (!selectedFile) {
      setError('파일을 선택해주세요.');
      setUploading(false);
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('difficulty', formData.difficulty);
      uploadFormData.append('tags', formData.tags);
      uploadFormData.append('isAI', formData.isAI);
      uploadFormData.append('isRequestedReview', formData.isRequestedReview);
      uploadFormData.append('media', selectedFile);

      await uploadContent(uploadFormData);
      alert('콘텐츠가 성공적으로 업로드되었습니다! 관리자 승인 후 공개됩니다.');
      window.location.href = '/';
    } catch (error: any) {
      setError(error.response?.data?.error || '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // AI 난이도 분석 호출
  const analyzeAI = async (file: any = selectedFile, desc: any = formData.description) => {
    if (!file && !desc) return;
    setAnalyzing(true);
    try {
      let imageUrl = '';
      if (file) {
        // 파일을 임시 URL로 변환 (실제 업로드 전 분석)
        imageUrl = URL.createObjectURL(file);
      }
      const result = await analyzeContentAI({ imageUrl, text: desc });
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // 파일/설명 변경 시 AI 분석
  useEffect(() => {
    if (selectedFile || formData.description) {
      analyzeAI(selectedFile, formData.description);
    } else {
      setAiAnalysis(null);
    }
    // eslint-disable-next-line
  }, [selectedFile, formData.description]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            콘텐츠 업로드
          </h1>
          <p className="text-xl text-gray-600">
            AI 생성 콘텐츠 또는 실제 콘텐츠를 업로드하세요
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                콘텐츠 제목 *
              </label>
              <Input
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="콘텐츠 제목을 입력하세요"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명 *
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="콘텐츠에 대한 설명을 입력하세요"
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="art">아트</option>
                  <option value="photography">사진</option>
                  <option value="video">비디오</option>
                  <option value="text">텍스트</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  난이도
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그 (쉼표로 구분)
              </label>
              <Input
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                placeholder="예: AI아트, 풍경, 디지털아트"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                콘텐츠 유형 *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isAI"
                    value="true"
                    checked={formData.isAI === 'true'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  AI 생성 콘텐츠
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isAI"
                    value="false"
                    checked={formData.isAI === 'false'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  실제 콘텐츠
                </label>
              </div>
            </div>

            {/* 감별 의뢰 체크박스 */}
            <div>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  name="isRequestedReview"
                  checked={formData.isRequestedReview}
                  onChange={e => setFormData({ ...formData, isRequestedReview: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-blue-700 font-semibold">감별 의뢰입니다 <span className="text-gray-500">(본인도 진위 여부를 모를 때 체크)</span></span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                미디어 파일 * (이미지 또는 비디오, 최대 10MB)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  선택된 파일: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              )}
            </div>

            {/* AI 난이도 분석 결과 표시 */}
            {(analyzing || aiAnalysis) && (
              <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-2 flex items-center gap-4">
                {analyzing ? (
                  <span className="text-blue-600 text-sm">AI 분석 중...</span>
                ) : aiAnalysis && (
                  <>
                    <span className="text-blue-700 font-semibold">예상 난이도:</span>
                    <span className="font-bold text-lg">
                      {aiAnalysis.predictedDifficulty === 'easy' && '쉬움'}
                      {aiAnalysis.predictedDifficulty === 'normal' && '보통'}
                      {aiAnalysis.predictedDifficulty === 'hard' && '어려움'}
                    </span>
                    <span className="text-blue-700 font-semibold ml-4">예상 정답률:</span>
                    <span className="font-bold text-lg">{aiAnalysis.predictedAccuracy}%</span>
                  </>
                )}
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </Button>
              <Button
                type="button"
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                취소
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 