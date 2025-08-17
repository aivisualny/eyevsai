'use client';

import { useState, useEffect } from 'react';
import { uploadContent, getMe, analyzeContentAI, isTokenValid } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { TagSelector } from '../../components/ui/TagSelector';

export default function UploadPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    category: 'other', // 기본값으로 유지 (백엔드에서 필요)
    tags: [],
    isAI: 'false',
    isRequestedReview: false
  });
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 먼저 토큰 갱신 시도
      const tokenRefreshed = await refreshTokenIfNeeded();
      
      if (!tokenRefreshed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
      }
      
      const data = await getMe();
      setUser(data.user);
    } catch (error: any) {
      console.error('인증 오류:', error);
      // 토큰이 유효하지 않은 경우에만 로그인 페이지로 이동
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
      } else {
        // 네트워크 오류 등 다른 오류의 경우
        setError('인증 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
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
      
      // 파일 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

    // 제목과 설명 길이 검증
    if (formData.title.length < 5) {
      setError('제목은 최소 5자 이상 입력해주세요.');
      setUploading(false);
      return;
    }

    if (formData.description.length < 10) {
      setError('설명은 최소 10자 이상 입력해주세요.');
      setUploading(false);
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', 'other'); // 기본값으로 설정
      
      // 태그 처리 개선
      if (formData.tags && formData.tags.length > 0) {
        // 태그 배열을 JSON 문자열로 변환
        const tagsJson = JSON.stringify(formData.tags);
        console.log('Tags to send:', formData.tags);
        console.log('Tags JSON:', tagsJson);
        uploadFormData.append('tags', tagsJson);
      } else {
        // 빈 태그 배열 전송
        uploadFormData.append('tags', JSON.stringify([]));
      }
      
      uploadFormData.append('isAI', formData.isAI);
      uploadFormData.append('isRequestedReview', formData.isRequestedReview);
      uploadFormData.append('media', selectedFile);

      // 디버그: FormData 내용 확인
      console.log('=== FRONTEND UPLOAD DEBUG ===');
      console.log('Selected file:', selectedFile);
      console.log('File name:', selectedFile.name);
      console.log('File size:', selectedFile.size);
      console.log('File type:', selectedFile.type);
      console.log('Form data:', formData);
      console.log('FormData entries:');
      // ES5 호환 방식으로 FormData 내용 출력
      const entries = Array.from(uploadFormData.entries());
      entries.forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
      console.log('=== END FRONTEND DEBUG ===');

      await uploadContent(uploadFormData);
      alert('콘텐츠가 성공적으로 업로드되었습니다!');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || '업로드에 실패했습니다.';
      setError(`업로드 실패: ${errorMessage}`);
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

  // 태그 변경 처리
  const handleTagsChange = (tags: string[]) => {
    setFormData({
      ...formData,
      tags: tags
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
                콘텐츠 제목 * (5-50자)
              </label>
              <Input
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="콘텐츠 제목을 입력하세요"
                maxLength={50}
                minLength={5}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.title.length}/50자
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명 * (10-300자)
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="콘텐츠에 대한 설명을 입력하세요"
                maxLength={300}
                minLength={10}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/300자
              </div>
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <TagSelector
                value={formData.tags}
                onChange={handleTagsChange}
                placeholder="태그를 선택하거나 입력하세요"
                maxTags={10}
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
                    name="contentType"
                    value="ai"
                    checked={formData.isAI === 'true' && !formData.isRequestedReview}
                    onChange={() => setFormData({ ...formData, isAI: 'true', isRequestedReview: false })}
                    className="mr-2 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    style={{ accentColor: '#2563eb' }}
                  />
                  AI 생성 콘텐츠
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contentType"
                    value="real"
                    checked={formData.isAI === 'false' && !formData.isRequestedReview}
                    onChange={() => setFormData({ ...formData, isAI: 'false', isRequestedReview: false })}
                    className="mr-2 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    style={{ accentColor: '#2563eb' }}
                  />
                  실제 콘텐츠
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contentType"
                    value="requested"
                    checked={formData.isRequestedReview}
                    onChange={() => setFormData({ ...formData, isRequestedReview: true, isAI: 'false' })}
                    className="mr-2 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    style={{ accentColor: '#2563eb' }}
                  />
                  <span className="text-sm text-yellow-800 font-semibold">
                    🔍 감별 의뢰입니다
                  </span>
                </label>
                <p className="text-xs text-yellow-700 mt-1 ml-6">
                  본인도 진위 여부를 모를 때 선택하세요. 다른 사용자들이 함께 판단해드립니다.
                </p>
              </div>
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
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    선택된 파일: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                  
                  {/* 파일 미리보기 */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {filePreview && (
                      selectedFile.type.startsWith('image/') ? (
                        <img
                          src={filePreview}
                          alt="미리보기"
                          className="w-full max-h-64 object-contain bg-gray-50"
                        />
                      ) : (
                        <video
                          src={filePreview}
                          controls
                          className="w-full max-h-64 object-contain bg-gray-50"
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI 정답률 분석 결과 표시 */}
            {(analyzing || aiAnalysis) && (
              <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 mb-2 flex items-center gap-4">
                {analyzing ? (
                  <span className="text-blue-600 text-sm">AI 분석 중...</span>
                ) : aiAnalysis && (
                  <>
                    <span className="text-blue-700 font-semibold">예상 정답률:</span>
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