import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getIpaForSchool, getSurveySessionsReport } from "@/app/actions";
import { PageWrap } from "@/components/layout/site-chrome";
import { IpaScatterChart } from "@/components/ipa/ipa-scatter-chart";
import { QuadrantGuide } from "@/components/ipa/quadrant-guide";
import { SurveySessionsReport } from "@/components/ipa/survey-sessions-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IpaResult } from "@/lib/ipa";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, Layers, Users } from "lucide-react";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: school } = await supabase
    .from("schools")
    .select("id, name")
    .eq("id", schoolId)
    .eq("admin_id", user.id)
    .maybeSingle();
  if (!school) notFound();

  const ipaResult = await getIpaForSchool(schoolId);
  if ("error" in ipaResult) {
    return (
      <main className="flex flex-1 flex-col">
        <PageWrap max="sm" className="py-10">
          <p className="text-destructive">{ipaResult.error}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/admin/${schoolId}`}>학교 대시보드로</Link>
          </Button>
        </PageWrap>
      </main>
    );
  }

  const ipaData = JSON.parse(JSON.stringify(ipaResult.data)) as IpaResult;
  const surveyReport = await getSurveySessionsReport(schoolId);

  const participantCount =
    "data" in surveyReport && surveyReport.data ? surveyReport.data.participantCount : 0;
  const sessions = "data" in surveyReport && surveyReport.data ? surveyReport.data.sessions : [];
  const surveyErr = "error" in surveyReport ? surveyReport.error : null;

  const hasResponse = ipaData.points.some((point) => point.responseCount > 0);
  const taskTotal = ipaData.points.length;
  const tasksWithRatings = ipaData.points.filter((p) => p.responseCount > 0).length;

  return (
    <div className="min-h-full flex-1">
      <main className="flex flex-1 flex-col">
        <PageWrap max="xl" className="flex flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">IPA 업무 분석 보고서</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{school.name}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              교직원 설문을 바탕으로 업무의 중요도·수행도를 나누어 보고, 분면별 해석과 제출 원본을 함께 제공합니다.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-2 shadow-sm">
            <Link href={`/admin/${schoolId}`}>학교 대시보드</Link>
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/80 shadow-sm ring-1 ring-border/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">분석 참여자 수</CardTitle>
              <Users className="size-4 text-chart-2" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-foreground">{participantCount}</p>
              <CardDescription className="mt-1">설문을 제출한 인원(제출 세션 수)</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm ring-1 ring-border/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">등록된 업무 수</CardTitle>
              <ClipboardList className="size-4 text-primary" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-foreground">{taskTotal}</p>
              <CardDescription className="mt-1">설문 문항(업무) 개수</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm ring-1 ring-border/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">집계 반영 업무</CardTitle>
              <Layers className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-foreground">{tasksWithRatings}</p>
              <CardDescription className="mt-1">응답이 하나라도 들어간 업무 수</CardDescription>
            </CardContent>
          </Card>
        </section>

        {surveyErr ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            설문 목록을 불러오지 못했습니다: {surveyErr}
          </p>
        ) : null}

        <section className="space-y-3">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold tracking-tight text-foreground">
            중요도·수행도 산점도
          </h2>
          <Card className="overflow-hidden border-primary/15 shadow-md ring-1 ring-primary/10">
            <CardHeader className="border-b border-border/60 bg-muted/30">
              <CardTitle className="text-base">업무 위치</CardTitle>
              <CardDescription>
                빨간 점선은 전체 평균 기준선입니다. 색은 분면({`Q1~Q4`})을 나타냅니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {hasResponse ? (
                <>
                  <IpaScatterChart data={ipaData} />
                  <p className="text-sm text-muted-foreground">
                    기준선 위치 — 수행도 평균 <strong className="text-foreground">{ipaData.xCutoff.toFixed(2)}</strong>
                    {" · "}
                    중요도 평균 <strong className="text-foreground">{ipaData.yCutoff.toFixed(2)}</strong>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">아직 제출된 설문이 없어 산점도를 그릴 수 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold tracking-tight text-foreground">
            분면별 업무 해석
          </h2>
          <QuadrantGuide data={ipaData} />
        </section>

        <section className="space-y-4">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold tracking-tight text-foreground">
            제출 설문 상세
          </h2>
          <p className="text-sm text-muted-foreground">
            각 행을 펼치면 업무별 점수를 확인할 수 있습니다. 잘못 제출된 경우 삭제 후 다시 받을 수 있습니다.
          </p>
          <SurveySessionsReport schoolId={schoolId} sessions={sessions} />
        </section>
        </PageWrap>
      </main>
    </div>
  );
}
