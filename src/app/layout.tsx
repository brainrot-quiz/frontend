import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Italian Brainrot Quiz | 이탈리안 브레인롯 퀴즈 게임',
  description: 'Italian Brainrot 캐릭터를 맞추는 재미있는 발음 퀴즈 게임. Tralalero, Bombardiro 등 이탈리안 브레인롯 캐릭터들의 이름을 맞춰보세요!',
  keywords: 'Italian Brainrot, 이탈리안 브레인롯, Tralalero, Bombardiro, 이탈리안 밈, 발음 퀴즈, 게임, 캐릭터 퀴즈',
  openGraph: {
    title: 'Italian Brainrot Quiz | 이탈리안 브레인롯 퀴즈 게임',
    description: 'Italian Brainrot 캐릭터를 맞추는 재미있는 발음 퀴즈 게임. Tralalero, Bombardiro 등 이탈리안 브레인롯 캐릭터들의 이름을 맞춰보세요!',
    url: 'https://italian-brainrot-quiz.vercel.app', // 실제 URL로 변경하세요
    siteName: 'Italian Brainrot Quiz',
    images: [
      {
        url: '/og-image.jpg', // 메인 이미지 경로 (public 폴더에 추가 필요)
        width: 1200,
        height: 630,
        alt: 'Italian Brainrot Quiz Preview',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Italian Brainrot Quiz Game',
    description: 'Fun pronunciation quiz featuring Italian Brainrot characters',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // 구글 서치 콘솔에서 받은 코드로 변경
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="pb-16">
        {children}
        </div>
        <Navigation />
      </body>
    </html>
  );
}
