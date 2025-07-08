import React from 'react';

export default function DeleteInfoPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">사용자 데이터 삭제 안내</h1>
      <p>EyeVSAI는 이용자의 개인정보 보호를 위해 데이터 삭제 요청을 신속하게 처리합니다.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. 직접 삭제 방법</h2>
      <ul className="list-disc ml-6">
        <li>마이페이지 &gt; 회원탈퇴 메뉴를 통해 직접 계정 및 모든 데이터를 삭제할 수 있습니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. 이메일 요청</h2>
      <ul className="list-disc ml-6">
        <li>직접 삭제가 어려운 경우, 아래 이메일로 삭제 요청이 가능합니다.</li>
        <li>이메일: aivisualny@gmail.com</li>
        <li>제목: [EyeVSAI] 데이터 삭제 요청</li>
        <li>본문: 가입 이메일, 닉네임(필수)</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. 삭제 처리 절차</h2>
      <ul className="list-disc ml-6">
        <li>요청 확인 후 7일 이내에 모든 데이터를 완전 삭제합니다.</li>
        <li>삭제 완료 시 안내 메일을 발송합니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. 기타</h2>
      <ul className="list-disc ml-6">
        <li>관련 법령에 따라 일정 기간 보관이 필요한 정보는 법령에 따라 보관 후 파기합니다.</li>
      </ul>
      <div className="text-gray-500 mt-8">최종 업데이트: 2024-06-XX</div>
    </div>
  );
} 