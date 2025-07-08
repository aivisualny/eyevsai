import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">서비스 이용약관</h1>
      <p>본 약관은 EyeVSAI(이하 '서비스')와 이용자 간의 권리, 의무 및 책임사항을 규정합니다.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. 목적</h2>
      <p>이 약관은 EyeVSAI가 제공하는 모든 서비스의 이용조건 및 절차, 이용자와 서비스의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. 이용계약의 성립</h2>
      <ul className="list-disc ml-6">
        <li>회원가입 시 본 약관에 동의한 것으로 간주합니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. 서비스의 제공 및 변경</h2>
      <ul className="list-disc ml-6">
        <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.</li>
        <li>서비스 내용은 회사의 사정에 따라 변경될 수 있습니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. 회원의 의무</h2>
      <ul className="list-disc ml-6">
        <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
        <li>서비스 이용 시 관련 법령 및 본 약관을 준수해야 합니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. 서비스 이용 제한 및 해지</h2>
      <ul className="list-disc ml-6">
        <li>이용자가 본 약관을 위반할 경우 서비스 이용이 제한될 수 있습니다.</li>
        <li>회원 탈퇴는 언제든지 가능합니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. 책임의 한계</h2>
      <ul className="list-disc ml-6">
        <li>서비스는 "있는 그대로" 제공되며, 서비스 이용으로 발생하는 문제에 대해 법령상 허용되는 범위 내에서 책임을 지지 않습니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. 분쟁 해결</h2>
      <ul className="list-disc ml-6">
        <li>서비스와 이용자 간 분쟁 발생 시, 상호 협의하여 해결하며, 협의가 어려운 경우 관할 법원에 소송을 제기할 수 있습니다.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">8. 약관의 변경</h2>
      <ul className="list-disc ml-6">
        <li>본 약관은 관련 법령 및 서비스 정책에 따라 변경될 수 있습니다.</li>
        <li>변경 시 서비스 내 공지합니다.</li>
      </ul>
      <div className="text-gray-500 mt-8">최종 업데이트: 2024-06-XX</div>
    </div>
  );
} 