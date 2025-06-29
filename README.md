# EyeVSAI - 당신의 눈은 AI보다 정확한가?

AI로 생성된 콘텐츠와 실제 콘텐츠를 구분하는 감별 커뮤니티 플랫폼입니다.

## 🎯 프로젝트 개요

EyeVSAI는 사용자들이 AI 생성 콘텐츠와 실제 콘텐츠를 구분하는 게임을 통해 AI 감별력을 기르고, 동시에 수집된 데이터를 AI 기술 발전에 기여하는 플랫폼입니다.

### 주요 기능

- **콘텐츠 업로드**: 사용자가 AI 생성 또는 실제 콘텐츠를 업로드
- **Real vs Fake 투표**: 정답을 모른 채 콘텐츠를 보고 투표
- **결과 공개**: 마감 후 정답과 AI 생성 도구 정보 공개
- **보상 시스템**: 정확한 판단에 대한 포인트와 뱃지 제공
- **데이터 수집**: 사람의 판단 기반 데이터를 AI 개선에 활용

## 🏗️ 프로젝트 구조

```
eyevsai/
├── frontend/              # Next.js 프론트엔드
│   ├── app/              # Next.js App Router
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티 및 설정
│   ├── hooks/           # 커스텀 훅
│   ├── types/           # TypeScript 타입
│   └── data/            # 목업 데이터
├── backend/              # Express.js 백엔드
│   ├── src/             # 소스 코드
│   ├── routes/          # API 라우트
│   ├── models/          # 데이터베이스 모델
│   ├── middleware/      # 미들웨어
│   └── utils/           # 유틸리티 함수
├── docs/                # 프로젝트 문서
│   ├── project-plan.md  # 프로젝트 기획서
│   ├── api.md          # API 문서
│   └── deployment.md   # 배포 가이드
└── package.json         # 모노레포 설정
```

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 14, React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi

## 📦 설치 및 실행

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn
- MongoDB (로컬 또는 클라우드)

### 전체 프로젝트 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/eyevsai.git
cd eyevsai

# 의존성 설치 (모든 워크스페이스)
npm install

# 개발 서버 실행 (프론트엔드 + 백엔드)
npm run dev
```

### 개별 실행

```bash
# 프론트엔드만 실행 (포트 3000)
npm run dev:frontend

# 백엔드만 실행 (포트 5000)
npm run dev:backend
```

### 빌드

```bash
# 전체 빌드
npm run build

# 개별 빌드
npm run build:frontend
npm run build:backend
```

## 🌐 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🎯 구현 단계

### 1차 구현 (완료) ✅
- ✅ 프론트엔드 MVP 완성
- ✅ 프로젝트 구조 정리
- ✅ 모노레포 설정
- ✅ 기본 백엔드 서버

### 2차 구현 (진행중) 🔄
- 🔄 사용자 인증 시스템
- 🔄 데이터베이스 연동
- 🔄 이미지 업로드 및 저장
- 🔄 투표 결과 저장
- 🔄 API 엔드포인트 구현

### 3차 구현 (예정) 🔄
- 🔄 포인트 및 뱃지 시스템
- 🔄 랭킹 페이지
- 🔄 통계 대시보드
- 🔄 관리자 패널
- 🔄 실시간 기능

## 📚 문서

자세한 문서는 [docs](./docs/) 폴더를 참조하세요:

- [프로젝트 기획서](./docs/project-plan.md)
- [API 문서](./docs/api.md)
- [배포 가이드](./docs/deployment.md)
- [기술 스택](./docs/tech-stack.md)

## 🧪 개발

### 개발 환경 설정

```bash
# 백엔드 환경변수 설정
cp backend/env.example backend/.env
# .env 파일을 편집하여 필요한 값들을 설정

# 프론트엔드 개발
cd frontend
npm run dev

# 백엔드 개발
cd backend
npm run dev
```

### 테스트

```bash
# 전체 테스트
npm test

# 개별 테스트
npm test --workspace=frontend
npm test --workspace=backend
```

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 개발 가이드라인

- **프론트엔드**: TypeScript, 함수형 컴포넌트, Tailwind CSS
- **백엔드**: Express.js, MongoDB, JWT 인증
- **코드 스타일**: ESLint 규칙 준수
- **커밋 메시지**: 명확하고 설명적인 메시지

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**"당신의 투표가 AI를 더 똑똑하게 만듭니다"** 🚀