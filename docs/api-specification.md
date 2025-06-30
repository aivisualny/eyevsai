# EyeVSAI Backend API 명세서

## 기본 정보
- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **인증**: JWT Bearer Token (Authorization 헤더)

## 인증 (Authentication)

### 회원가입
```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "points": 0,
    "totalVotes": 0,
    "correctVotes": 0
  }
}
```

### 로그인
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "points": 0,
    "totalVotes": 0,
    "correctVotes": 0
  }
}
```

### 현재 사용자 정보
```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "points": 100,
    "totalVotes": 50,
    "correctVotes": 35,
    "accuracy": 70
  }
}
```

## 콘텐츠 (Content)

### 콘텐츠 목록 조회
```
GET /content?page=1&limit=10&category=art&difficulty=medium
```

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `category`: 카테고리 필터 (art, photography, video, text, other)
- `difficulty`: 난이도 필터 (easy, medium, hard)

**Response:**
```json
{
  "contents": [
    {
      "id": "content_id",
      "title": "AI Generated Art",
      "description": "Beautiful artwork created by AI",
      "mediaUrl": "/uploads/image-123.jpg",
      "mediaType": "image",
      "category": "art",
      "difficulty": "medium",
      "votes": {
        "ai": 25,
        "real": 15
      },
      "totalVotes": 40,
      "views": 150,
      "uploadedBy": {
        "id": "user_id",
        "username": "artist"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 50
}
```

### 콘텐츠 상세 조회
```
GET /content/:id
```

**Response:**
```json
{
  "content": {
    "id": "content_id",
    "title": "AI Generated Art",
    "description": "Beautiful artwork created by AI",
    "mediaUrl": "/uploads/image-123.jpg",
    "mediaType": "image",
    "category": "art",
    "difficulty": "medium",
    "votes": {
      "ai": 25,
      "real": 15
    },
    "totalVotes": 40,
    "views": 151,
    "uploadedBy": {
      "id": "user_id",
      "username": "artist"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 콘텐츠 업로드
```
POST /content
```

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: multipart/form-data
```

**Form Data:**
- `title`: 콘텐츠 제목
- `description`: 콘텐츠 설명
- `category`: 카테고리 (art, photography, video, text, other)
- `tags`: 태그 (쉼표로 구분)
- `difficulty`: 난이도 (easy, medium, hard)
- `isAI`: AI 생성 여부 (true/false)
- `media`: 미디어 파일

**Response:**
```json
{
  "message": "Content uploaded successfully",
  "content": {
    "id": "content_id",
    "title": "AI Generated Art",
    "description": "Beautiful artwork created by AI",
    "mediaUrl": "/uploads/image-123.jpg",
    "mediaType": "image",
    "category": "art",
    "status": "pending"
  }
}
```

### 내 업로드 콘텐츠 조회
```
GET /content/user/uploads?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

## 투표 (Votes)

### 투표하기
```
POST /votes
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "contentId": "content_id",
  "vote": "ai"
}
```

**Response:**
```json
{
  "message": "투표 완료",
  "vote": {
    "id": "vote_id",
    "content": "content_id",
    "user": "user_id",
    "vote": "ai",
    "votedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 내 투표 내역 조회
```
GET /votes/my
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "votes": [
    {
      "id": "vote_id",
      "content": {
        "id": "content_id",
        "title": "AI Generated Art",
        "mediaUrl": "/uploads/image-123.jpg"
      },
      "vote": "ai",
      "votedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 운영자 (Admin)

### 콘텐츠 정답 공개
```
PATCH /admin/content/:id/reveal
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "message": "정답이 공개되었습니다.",
  "content": {
    "id": "content_id",
    "isAnswerRevealed": true,
    "revealDate": "2024-01-01T00:00:00.000Z"
  }
}
```

### 유저 포인트 수정
```
PATCH /admin/user/:id/points
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "points": 100
}
```

**Response:**
```json
{
  "message": "포인트가 수정되었습니다.",
  "user": {
    "id": "user_id",
    "username": "testuser",
    "points": 100
  }
}
```

## 에러 코드

| 상태 코드 | 설명 |
|-----------|------|
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 실패 (토큰 없음 또는 만료) |
| 403 | 권한 없음 (관리자 권한 필요) |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

## 파일 업로드

- **지원 형식**: JPEG, JPG, PNG, GIF, MP4, AVI, MOV, WEBM
- **최대 크기**: 10MB
- **업로드 경로**: `/uploads/` 디렉토리

## 환경변수 설정

```env
# 서버 설정
PORT=5000
NODE_ENV=development

# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/eyevsai

# JWT
JWT_SECRET=your_jwt_secret_key_here

# 프론트엔드 URL
FRONTEND_URL=http://localhost:3000
``` 