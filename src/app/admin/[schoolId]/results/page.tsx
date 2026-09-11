import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageWrap } from "@/components/layout/site-chrome";
import { IpaScatterChart } from "@/components/ipa/ipa-scatter-chart";
import { QuadrantGuide } from "@/components/ipa/quadrant-guide";
import { ResultExports } from "@/components/ipa/result-exports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignReport } from "@/lib/campaign-results";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, Layers, Users } from "lucide-react";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { schoolId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: school } = await supabase.from("schools").select("id, name").eq("id", schoolId).eq("admin_id", user.id).maybeSingle();
  if (!school) notFound();
  const { data: campaigns } = await supabase.from("survey_campaigns").select("id, title, status, created_at").eq("school_id", schoolId).order("created_at", { ascending: false });
  const selectedId = query.campaign ?? campaigns?.find((campaign) => campaign.status !== "draft")?.id ?? campaigns?.[0]?.id;

  if (!selectedId) {
    return (
      <main className="flex flex-1 flex-col"><PageWrap max="sm"><p className="text-muted-foreground">아직 결과를 볼 설문 회차가 없습니다.</p><Button asChild variant="outline" className="mt-4"><Link href={`/admin/${schoolId}`}>학교 대시보드</Link></Button></PageWrap></main>
    );
  }

  const report = await getCampaignReport(selectedId);
  if ("error" in report || !report.data || report.data.campaign.school_id !== schoolId) notFound();
  const data = report.data;

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="xl" className="flex flex-col gap-8 print:max-w-none print:px-0">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">IPA 업무 분석 보고서</p>
            <h1 className="mt-2 font-heading text-2xl font-bold md:text-3xl">{school.name}</h1>
            <p className="mt-1 font-medium text-primary">{data.campaign.title}</p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <ResultExports schoolName={school.name} campaignTitle={data.campaign.title} opensAt={data.campaign.opens_at} closesAt={data.campaign.closes_at} participantCount={data.participantCount} tokenTotal={data.tokenTotal} ipa={data.ipa} responses={data.anonymousResponses} />
            <Button asChild variant="outline"><Link href={`/admin/${schoolId}`}>학교 대시보드</Link></Button>
          </div>
        </header>

        <nav className="no-print flex flex-wrap gap-2" aria-label="설문 회차 선택">
          {(campaigns ?? []).map((campaign) => (
            <Button key={campaign.id} asChild size="sm" variant={campaign.id === selectedId ? "default" : "outline"}>
              <Link href={`/admin/${schoolId}/results?campaign=${campaign.id}`}>{campaign.title}</Link>
            </Button>
          ))}
        </nav>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">제출 인원</CardTitle><Users className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-bold tabular-nums">{data.participantCount}</p><CardDescription>발급 {data.tokenTotal}개 중 제출 완료</CardDescription></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">등록 업무</CardTitle><ClipboardList className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-bold tabular-nums">{data.taskTotal}</p><CardDescription>회차 개시 시 고정된 문항</CardDescription></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">집계 업무</CardTitle><Layers className="size-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-bold tabular-nums">{data.ipa.points.length}</p><CardDescription>제출 응답이 있는 업무</CardDescription></CardContent></Card>
        </section>

        <section className="space-y-3">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold">중요도·수행도 산점도</h2>
          <Card><CardHeader><CardTitle className="text-base">업무 위치</CardTitle><CardDescription>점에 마우스를 가까이 가져가거나 키보드로 선택하면 업무명과 점수가 표시됩니다.</CardDescription></CardHeader><CardContent>{data.ipa.points.length ? <IpaScatterChart data={data.ipa} /> : <p className="text-sm text-muted-foreground">제출된 응답이 없습니다.</p>}</CardContent></Card>
        </section>

        <section className="space-y-3"><h2 className="border-l-4 border-primary pl-3 text-lg font-bold">분면별 업무 해석</h2><QuadrantGuide data={data.ipa} /></section>

        <section className="space-y-3">
          <h2 className="border-l-4 border-primary pl-3 text-lg font-bold">익명 제출 현황</h2>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">개인 식별정보 없이 응답자 번호로만 집계합니다.</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{data.anonymousResponses.map((response) => <li key={response.tokenId} className="rounded-md border px-3 py-2 text-sm"><strong>응답자 {response.respondentNumber}</strong><span className="ml-2 text-muted-foreground">{new Date(response.submittedAt).toLocaleString("ko-KR")}</span></li>)}</ul></CardContent></Card>
        </section>
      </PageWrap>
    </main>
  );
}
