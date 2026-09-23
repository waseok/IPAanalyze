import type { Metadata } from "next";
import { Geist_Mono, Gothic_A1, Noto_Serif_KR } from "next/font/google";
import { SiteBackdrop } from "@/components/layout/site-chrome";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/* 본문: 기하학적 한글 산세리프 — 행정 UI 가독성 */
const body = Gothic_A1({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* 브랜드·제목: 세리프 — 학교·기관 신뢰감 */
const display = Noto_Serif_KR({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "학교 업무 IPA",
  description: "학교 업무의 중요도·수행도를 분석하는 IPA(Importance–Performance Analysis) 운영 도구입니다.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${body.variable} ${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteBackdrop />
        <TooltipProvider>
          <div className="relative flex min-h-full flex-1 flex-col">{children}</div>
        </TooltipProvider>
      </body>
    </html>
  );
}
