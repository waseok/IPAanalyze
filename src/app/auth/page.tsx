import Link from "next/link";
import { AuthPageClient } from "@/components/auth-page-client";
import { PageWrap } from "@/components/layout/site-chrome";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export default function AuthPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="md" className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit gap-1 font-normal">
              <BarChart3 className="size-3" aria-hidden />
              관리자 · 업무 분석
            </Badge>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">관리자 인증</h1>
              <p className="mt-1 text-sm text-muted-foreground">로그인 후 학교 워크스페이스와 IPA 결과를 이용할 수 있습니다.</p>
            </div>
          </div>
          <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href="/">
            홈으로
          </Link>
        </header>
        <AuthPageClient />
      </PageWrap>
    </main>
  );
}
