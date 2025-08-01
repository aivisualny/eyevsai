# AI 탐지기 구현 가이드

## 현재 상태
- **난이도 분석**: 텍스트 키워드 기반 (목업)
- **AI 탐지**: DB 저장값 반환 (목업)
- **이미지/비디오 분석**: 미구현

## 구현 필요 사항

### 1. 이미지 분석 API 연동
```javascript
// 예시: Google Vision API
const analyzeImage = async (imageUrl) => {
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();
  
  const [result] = await client.labelDetection(imageUrl);
  const labels = result.labelAnnotations;
  
  // 분석 결과를 바탕으로 난이도 예측
  return {
    predictedDifficulty: 'medium',
    predictedAccuracy: 75
  };
};
```

### 2. AI 생성 콘텐츠 탐지
```javascript
// 예시: AI 탐지 서비스 연동
const detectAIGenerated = async (imageUrl) => {
  // 1. 이미지를 AI 탐지 서비스로 전송
  // 2. GAN, Diffusion 모델 탐지
  // 3. 신뢰도 점수 반환
  
  return {
    aiDetectionResult: 'FAKE', // or 'REAL'
    aiConfidence: 85, // 0-100
    detectionModel: 'AI Detection Model v2.0'
  };
};
```

### 3. 비디오 분석
```javascript
// 비디오 프레임 추출 및 분석
const analyzeVideo = async (videoUrl) => {
  // 1. 비디오에서 키프레임 추출
  // 2. 각 프레임을 이미지로 분석
  // 3. 전체 비디오의 AI 생성 여부 판단
  
  return {
    aiDetectionResult: 'REAL',
    aiConfidence: 92,
    detectionModel: 'Video AI Detection v1.0'
  };
};
```

## 추천 AI 서비스

### 이미지 분석
- **Google Vision API**: 객체 인식, 텍스트 추출
- **Azure Computer Vision**: 이미지 분석, 품질 평가
- **AWS Rekognition**: 이미지 및 비디오 분석

### AI 생성 콘텐츠 탐지
- **Hugging Face**: AI 탐지 모델
- **Clarity AI**: AI 생성 콘텐츠 탐지
- **Custom Model**: 자체 학습 모델

### 비디오 분석
- **FFmpeg**: 비디오 프레임 추출
- **OpenCV**: 비디오 처리
- **TensorFlow**: 비디오 분석 모델

## 구현 단계

1. **1단계**: 이미지 분석 API 연동
2. **2단계**: AI 탐지 서비스 연동
3. **3단계**: 비디오 분석 구현
4. **4단계**: 성능 최적화

## 환경 변수 설정
```env
# AI 서비스 API 키
GOOGLE_VISION_API_KEY=your_api_key
AI_DETECTION_API_KEY=your_api_key
VIDEO_ANALYSIS_API_KEY=your_api_key
```

## 비용 고려사항
- API 호출당 비용 발생
- 이미지/비디오 크기에 따른 비용 증가
- 캐싱 전략 필요 