import Link from "next/link";
import { IpaHeroVisual } from "@/components/ipa/ipa-hero-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 flex-col">
      {/* 히어로: brand + headline + support + CTA + dominant visual — 카드/통계 없음 */}
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 py-10 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-10 md:px-6 md:py-14 lg:gap-14">
          <div className="relative z-10 max-w-xl space-y-6">
            <p className="motion-fade-up font-heading text-[1.65rem] font-semibold tracking-tight text-navy sm:text-2xl md:text-3xl">
              학교 업무 IPA
            </p>
            <div className="space-y-3.5">
              <h1 className="motion-fade-up motion-delay-1 font-heading text-[1.55rem] font-semibold leading-snug tracking-tight text-foreground sm:text-[1.85rem] md:text-4xl md:leading-tight">
                중요도와 수행도로
                <br className="hidden sm:block" /> 학교 업무의 우선순위를 읽습니다
              </h1>
              <p className="motion-fade-up motion-delay-2 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground md:text-lg">
                교직원은 6자리 참여코드로 익명 평가에 참여하고, 관리자는 IPA 매트릭스로 개선 지점을 확인합니다.
              </p>
            </div>

            <div className="motion-fade-up motion-delay-3 space-y-3">
              <form action="/s" className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="school-code" className="text-xs font-medium tracking-wide text-muted-foreground">
                    참여코드 (숫자 6자리)
                  </label>
                  <Input
                    id="school-code"
                    name="code"
                    inputMode="numeric"
                    placeholder="예: 482193"
                    maxLength={6}
                    required
                    className="h-11 border-border/90 bg-card/80 font-mono text-base tracking-[0.35em] shadow-none"
                  />
                </div>
                <Button type="submit" size="lg" className="h-11 shrink-0 px-5 sm:min-w-[5.5rem]">
                  설문 입장
                </Button>
              </form>
              {params.error === "invalid-code" ? (
                <p className="text-sm font-medium text-destructive" role="alert">
                  유효하지 않은 참여코드입니다. 안내받은 코드를 다시 확인해주세요.
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                학교 관리자이신가요?{" "}
                <Link href="/auth" className="font-medium text-primary underline-offset-4 hover:underline">
                  로그인
                </Link>
                {" · "}
                <Link href="/admin" className="font-medium text-primary underline-offset-4 hover:underline">
                  콘솔
                </Link>
              </p>
            </div>
          </div>

          <div className="motion-fade-up motion-delay-4 relative mx-auto flex w-full max-w-[20rem] justify-center sm:max-w-[22rem] md:mx-0 md:max-w-none md:justify-end">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[40%] bg-[radial-gradient(circle_at_center,oklch(0.7_0.08_250/0.2),transparent_68%)] md:-inset-10"
            />
            <IpaHeroVisual className="w-full max-w-md" />
          </div>
        </div>
      </section>

      {/* 한 섹션 = 한 역할: 관리자 안내 */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-[var(--space-section)] md:flex-row md:items-end md:justify-between md:px-6">
          <div className="max-w-xl space-y-2">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              관리자 워크스페이스
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              업무 목록 업로드, 설문 회차·참여코드 발급, IPA 결과 확인을 한 콘솔에서 운영합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/auth">관리자 로그인</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">대시보드 열기</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
