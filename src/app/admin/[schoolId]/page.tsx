import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageWrap } from "@/components/layout/site-chrome";
import { TaskListEditor } from "@/components/task-list-editor";
import { CampaignManager, type CampaignSummary } from "@/components/campaign-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const sectionTitleClass =
  "border-l-4 border-primary pl-3 text-lg font-bold tracking-tight text-foreground";

export default async function SchoolDashboardPage({
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
    .select("id, name, code")
    .eq("id", schoolId)
    .eq("admin_id", user.id)
    .maybeSingle();
  if (!school) notFound();

  const [{ data: tasks }, { data: campaigns }] = await Promise.all([
    supabase.from("tasks").select("id, title, position").eq("school_id", schoolId).order("position"),
    supabase.from("survey_campaigns").select("id, title, status, opens_at, closes_at, created_at").eq("school_id", schoolId).order("created_at", { ascending: false }),
  ]);
  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);
  const [{ data: campaignTasks }, { data: tokens }] = campaignIds.length
    ? await Promise.all([
        supabase.from("campaign_tasks").select("campaign_id").in("campaign_id", campaignIds),
        supabase.from("participant_tokens").select("id, campaign_id, code_hint, created_at, submitted_at, revoked_at").in("campaign_id", campaignIds),
      ])
    : [{ data: [] }, { data: [] }];
  const campaignSummaries: CampaignSummary[] = (campaigns ?? []).map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    opensAt: campaign.opens_at,
    closesAt: campaign.closes_at,
    taskCount: (campaignTasks ?? []).filter((row) => row.campaign_id === campaign.id).length,
    tokenCount: (tokens ?? []).filter((row) => row.campaign_id === campaign.id && !row.revoked_at).length,
    submittedCount: (tokens ?? []).filter((row) => row.campaign_id === campaign.id && !row.revoked_at && row.submitted_at).length,
    unusedTokens: (tokens ?? [])
      .filter((row) => row.campaign_id === campaign.id && !row.revoked_at && !row.submitted_at)
      .map((row) => ({ id: row.id, hint: row.code_hint, createdAt: row.created_at })),
  }));

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{school.name}</h1>
        <Button asChild variant="outline">
          <Link href="/admin">목록으로</Link>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-10 font-semibold">
          <Link href={`/admin/${school.id}/upload`}>업무 목록 일괄 업로드 (PDF·Excel)</Link>
        </Button>
        <Button asChild variant="secondary" className="h-10 font-semibold">
          <Link href={`/admin/${school.id}/results`}>IPA 결과 보기</Link>
        </Button>
      </div>

      <Card className="border-primary/20 shadow-md ring-1 ring-primary/10">
        <CardHeader className="border-b border-border/50 bg-primary/[0.06] pb-4 dark:bg-primary/10">
          <CardTitle className={`${sectionTitleClass} border-primary`}>업무 목록</CardTitle>
          <CardDescription>
            항목을 수정·삭제하거나 아래에서 추가할 수 있습니다. 일괄 반영은{" "}
            <Link href={`/admin/${school.id}/upload`} className="font-semibold text-primary underline underline-offset-2">
              업로드 페이지
            </Link>
            를 이용하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TaskListEditor
            schoolId={school.id}
            tasks={(tasks ?? []).map((task, index) => ({ ...task, position: task.position ?? index + 1 }))}
          />
        </CardContent>
      </Card>

      <Card className="border-primary/20 shadow-md ring-1 ring-primary/10">
        <CardHeader className="border-b border-border/50 bg-primary/[0.06] pb-4">
          <CardTitle className={`${sectionTitleClass} border-primary`}>설문 회차와 참여코드</CardTitle>
          <CardDescription>회차를 열면 현재 업무 목록이 고정됩니다. 참여코드는 익명 응답자별로 발급됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <CampaignManager schoolId={school.id} campaigns={campaignSummaries} />
        </CardContent>
      </Card>
      </PageWrap>
    </main>
  );
}
