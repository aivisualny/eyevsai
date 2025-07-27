import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// JWT 토큰을 localStorage에서 가져와 헤더에 추가
function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 회원가입
export async function register(data: { username: string; email: string; password: string }) {
  const res = await axios.post(`${API_BASE}/auth/register`, data);
  return res.data;
}

// 로그인
export async function login(data: { email: string; password: string }) {
  const res = await axios.post(`${API_BASE}/auth/login`, data);
  return res.data;
}

// 내 정보
export async function getMe() {
  const res = await axios.get(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  return res.data;
}

// 콘텐츠 목록
export async function getContents(params?: any) {
  const res = await axios.get(`${API_BASE}/content`, { params });
  return res.data;
}

// 콘텐츠 상세
export async function getContent(id: string) {
  const res = await axios.get(`${API_BASE}/content/${id}`);
  return res.data;
}

// 콘텐츠 업로드
export async function uploadContent(formData: FormData) {
  const res = await axios.post(`${API_BASE}/content`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// 내 업로드 콘텐츠
export async function getMyUploads(params?: any) {
  const res = await axios.get(`${API_BASE}/content/user/uploads`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data;
}

// 내가 요청한 감별 콘텐츠
export async function getMyRequestedReviews(params?: any) {
  const res = await axios.get(`${API_BASE}/content/user/requested-reviews`, {
    headers: getAuthHeaders(),
    params,
  });
  return res.data;
}

// 투표하기
export async function voteContent(data: { contentId: string; vote: 'ai' | 'real' }) {
  const res = await axios.post(`${API_BASE}/votes`, data, { headers: getAuthHeaders() });
  return res.data;
}

// 내 투표 내역
export async function getMyVotes() {
  const res = await axios.get(`${API_BASE}/votes/my`, { headers: getAuthHeaders() });
  return res.data;
}

// 관리자: 콘텐츠 승인/거절
export async function updateContentStatus(id: string, status: 'approved' | 'rejected') {
  const res = await axios.patch(`${API_BASE}/content/admin/${id}/status`, { status }, { headers: getAuthHeaders() });
  return res.data;
}

// 관리자: 정답 공개
export async function revealContentAnswer(id: string) {
  const res = await axios.patch(`${API_BASE}/admin/content/${id}/reveal`, {}, { headers: getAuthHeaders() });
  return res.data;
}

// 관리자: 유저 포인트 수정
export async function updateUserPoints(id: string, points: number) {
  const res = await axios.patch(`${API_BASE}/admin/user/${id}/points`, { points }, { headers: getAuthHeaders() });
  return res.data;
}

// 정답률 랭킹
export async function getRanking() {
  const res = await axios.get(`${API_BASE}/admin/ranking`);
  return res.data;
}

// 댓글 목록 조회
export async function getComments(contentId: string) {
  const res = await axios.get(`${API_BASE}/content/${contentId}/comments`);
  return res.data;
}

// 댓글 작성
export async function postComment(contentId: string, text: string) {
  const res = await axios.post(`${API_BASE}/content/${contentId}/comments`, { text }, { headers: getAuthHeaders() });
  return res.data;
}

// 댓글 삭제
export async function deleteComment(commentId: string) {
  const res = await axios.delete(`${API_BASE}/content/comments/${commentId}`, { headers: getAuthHeaders() });
  return res.data;
}

// 댓글 좋아요/취소/조회
export async function likeComment(commentId: string) {
  const res = await axios.post(`${API_BASE}/comments/${commentId}/like`, {}, { headers: getAuthHeaders() });
  return res.data;
}
export async function unlikeComment(commentId: string) {
  const res = await axios.delete(`${API_BASE}/comments/${commentId}/like`, { headers: getAuthHeaders() });
  return res.data;
}
export async function getCommentLikes(commentId: string) {
  const res = await axios.get(`${API_BASE}/comments/${commentId}/likes`);
  return res.data;
}

// 콘텐츠 리사이클
export async function recycleContent(contentId: string) {
  const res = await axios.post(`${API_BASE}/content/${contentId}/recycle`, {}, { headers: getAuthHeaders() });
  return res.data;
}
export async function getRecycledContents() {
  const res = await axios.get(`${API_BASE}/content/recycle`);
  return res.data;
}

// AI 난이도 분석
export async function analyzeContentAI(data: { imageUrl?: string; text?: string }) {
  const res = await axios.post(`${API_BASE}/content/analyze`, data, { headers: getAuthHeaders() });
  return res.data;
}

// 팔로우/언팔로우
export async function followUser(userId: string) {
  const res = await axios.post(`${API_BASE}/users/${userId}/follow`, {}, { headers: getAuthHeaders() });
  return res.data;
}
export async function unfollowUser(userId: string) {
  const res = await axios.delete(`${API_BASE}/users/${userId}/follow`, { headers: getAuthHeaders() });
  return res.data;
}
export async function getFollowers(userId: string) {
  const res = await axios.get(`${API_BASE}/users/${userId}/followers`);
  return res.data;
}
export async function getFollowing(userId: string) {
  const res = await axios.get(`${API_BASE}/users/${userId}/following`);
  return res.data;
}

// 뱃지 관련 API
export async function getAllBadges() {
  const res = await axios.get(`${API_BASE}/badges`);
  return res.data;
}

export async function getMyBadges() {
  const res = await axios.get(`${API_BASE}/badges/my`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getBadgeDetail(id: string) {
  const res = await axios.get(`${API_BASE}/badges/${id}`);
  return res.data;
}

// 투표 통계 관련 API
export async function getMyVoteStats() {
  const res = await axios.get(`${API_BASE}/votes/my/stats`, { headers: getAuthHeaders() });
  return res.data;
}

// 전체 통계 조회
export async function getGlobalStats() {
  const res = await axios.get(`${API_BASE}/admin/stats`);
  return res.data;
}

// 내 투표 내역 (필터링 지원)
export async function getMyVotesFiltered(params?: {
  isCorrect?: boolean;
  page?: number;
  limit?: number;
}) {
  const res = await axios.get(`${API_BASE}/votes/my`, { 
    headers: getAuthHeaders(),
    params 
  });
  return res.data;
}

// 회원탈퇴
export async function withdraw() {
  const res = await axios.delete(`${API_BASE}/auth/delete`, { headers: getAuthHeaders() });
  return res.data;
} 