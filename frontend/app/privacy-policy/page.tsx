import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      <p>EyeVSAI(이하 '서비스')는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다. 본 방침은 EyeVSAI가 어떤 정보를 수집하고, 어떻게 이용하며, 정보를 보호하는지 안내합니다.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. 수집하는 개인정보 항목</h2>
      <ul className="list-disc ml-6">
        <li>이메일, 닉네임(필수)</li>
        <li>소셜 로그인 시 제공되는 프로필 정보(이메일, 이름, 프로필 사진 등)</li>
        <li>서비스 이용 기록, 접속 로그, 쿠키, IP 정보</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. 개인정보의 수집 및 이용 목적</h2>
      <ul className="list-disc ml-6">
        <li>회원 가입 및 관리</li>
        <li>서비스 제공 및 개선</li>
        <li>문의 및 민원 처리</li>
        <li>법적 의무 준수</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. 개인정보의 보유 및 이용 기간</h2>
      <ul className="list-disc ml-6">
        <li>회원 탈퇴 시 즉시 파기</li>
        <li>관련 법령에 따라 일정 기간 보관 필요 시 해당 기간 동안 보관</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. 개인정보의 제3자 제공</h2>
      <ul className="list-disc ml-6">
        <li>원칙적으로 외부에 제공하지 않음</li>
        <li>법령에 의거하거나, 이용자의 동의가 있는 경우에만 제공</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. 개인정보의 파기 절차 및 방법</h2>
      <ul className="list-disc ml-6">
        <li>전자적 파일: 복구 불가능한 방법으로 삭제</li>
        <li>종이 문서: 분쇄 또는 소각</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. 이용자 및 법정대리인의 권리와 행사 방법</h2>
      <ul className="list-disc ml-6">
        <li>언제든지 개인정보 열람, 정정, 삭제, 처리정지 요청 가능</li>
        <li>서비스 내 '마이페이지' 또는 문의를 통해 요청 가능</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. 개인정보 보호책임자</h2>
      <ul className="list-disc ml-6">
        <li>이메일: aivisualny@gmail.com</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">8. 기타</h2>
      <ul className="list-disc ml-6">
        <li>본 방침은 관련 법령 및 서비스 정책에 따라 변경될 수 있습니다.</li>
        <li>변경 시 서비스 내 공지합니다.</li>
      </ul>
      <div className="text-gray-500 mt-8">최종 업데이트: 2024-06-XX</div>
    </div>
  );
} 