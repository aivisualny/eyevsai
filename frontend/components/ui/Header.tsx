"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const Header = ({ user, onLogout, onWithdraw }: {
  user?: { username: string } | null;
  onLogout?: () => void;
  onWithdraw?: () => void;
}) => {
  const [dropdown, setDropdown] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
          <img src="/eyesai_icon.png" alt="EyeVSAI Logo" className="w-8 h-8 rounded-full bg-blue-600" />
          EyeVSAI
        </Link>
        {/* 네비게이션 */}
        <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
          <Link href="/">홈</Link>
          <Link href="/vote">투표하기</Link>
          <Link href="/stats">통계</Link>
          <Link href="/ranking">랭킹</Link>
          <Link href="/mypage">마이페이지</Link>
          <Link href="/upload">업로드</Link>
          <Link href="/guide">가이드</Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* 로그인/내정보 */}
          {user ? (
            <div className="relative">
              <button
                className="px-4 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold"
                onClick={() => setDropdown((v) => !v)}
              >
                {user.username} ▼
              </button>
              {dropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                  <a
                    href="/mypage"
                    className="w-full block text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={() => setDropdown(false)}
                  >
                    마이페이지
                  </a>
                  <a
                    href="/stats"
                    className="w-full block text-left px-4 py-2 hover:bg-gray-100 text-gray-700 border-t"
                    onClick={() => setDropdown(false)}
                  >
                    나의 통계
                  </a>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 border-t"
                    onClick={() => { setDropdown(false); onLogout && onLogout(); }}
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold">로그인</Link>
              <Link href="/register" className="px-4 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 