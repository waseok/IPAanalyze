import Link from "next/link";
import { PageWrap } from "@/components/layout/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart3, Building2, ClipboardList } from "lucide-react";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="xl" className="flex flex-col gap-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 border-primary/25 bg-primary/10 font-normal text-primary">
              <BarChart3 className="size-3.5" aria-hidden />
              업무 IPA · 중요도·수행도 분석
            </Badge>
          </div>
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              교직원 업무를 데이터로 읽는{" "}
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">IPA 평가</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              업무 목록을 바탕으로 중요도와 수행도를 수집하고, 매트릭스·산점도로 우선순위와 개선 여지를 한눈에 확인합니다.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/80 shadow-md ring-1 ring-border/40 transition-shadow hover:shadow-lg">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <ClipboardList className="size-5 shrink-0" aria-hidden />
                <CardTitle className="font-heading text-xl">교직원 설문 참여</CardTitle>
              </div>
              <CardDescription className="text-pretty">학교에서 받은 숫자 6자리 참여코드로 익명 설문에 들어갑니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/s" className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="school-code" className="text-xs font-medium text-muted-foreground">
                    참여코드 (숫자 6자리)
                  </label>
                  <Input
                    id="school-code"
                    name="code"
                    inputMode="numeric"
                    placeholder="예: 482193"
                    maxLength={6}
                    required
                    className="font-mono text-base tracking-[0.35em]"
                  />
                </div>
                <Button type="submit" className="shrink-0 sm:min-w-[5rem]">
                  입장
                </Button>
              </form>
              {params.error === "invalid-code" ? <p className="mt-3 text-sm font-medium text-destructive">유효하지 않은 참여코드입니다. 안내받은 코드를 다시 확인해주세요.</p> : null}
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-md ring-1 ring-primary/15 transition-shadow hover:shadow-lg">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="size-5 shrink-0" aria-hidden />
                <CardTitle className="font-heading text-xl">학교 관리자</CardTitle>
              </div>
              <CardDescription className="text-pretty">
                업무 업로드·목록 편집, 설문 공유, IPA 결과 리포트까지 한 곳에서 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/auth">로그인 / 가입</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/admin">관리자 대시보드</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </PageWrap>
    </main>
  );
}
