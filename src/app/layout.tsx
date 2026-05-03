import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteBackdrop } from "@/components/layout/site-chrome";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "학교 업무 IPA 평가",
  description: "학교 코드로 설문에 참여하고, 관리자는 중요도·수행도(IPA) 결과를 분석합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
