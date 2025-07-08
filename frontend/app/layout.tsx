import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EyeVSAI - 당신의 눈은 AI보다 정확한가?',
  description: 'AI로 생성된 콘텐츠와 실제 콘텐츠를 구분하는 감별 커뮤니티 플랫폼',
  keywords: 'AI, 콘텐츠 감별, 딥페이크, 커뮤니티, 투표',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
} 