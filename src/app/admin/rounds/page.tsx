import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, PageWrap } from "@/components/layout/site-chrome";
import { CampaignManager, type CampaignSummary } from "@/components/campaign-manager";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

async function loadCampaignSummaries(schoolId: string) {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("survey_campaigns")
    .select("id, title, status, opens_at, closes_at, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id);
  const [{ data: campaignTasks }, { data: tokens }] = campaignIds.length
    ? await Promise.all([
        supabase.from("campaign_tasks").select("campaign_id").in("campaign_id", campaignIds),
        supabase
          .from("participant_tokens")
          .select("id, campaign_id, code_hint, created_at, submitted_at, revoked_at")
          .in("campaign_id", campaignIds),
      ])
    : [{ data: [] }, { data: [] }];

  const summaries: CampaignSummary[] = (campaigns ?? []).map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    opensAt: campaign.opens_at,
    closesAt: campaign.closes_at,
    taskCount: (campaignTasks ?? []).filter((row) => row.campaign_id === campaign.id).length,
    tokenCount: (tokens ?? []).filter((row) => row.campaign_id === campaign.id && !row.revoked_at).length,
    submittedCount: (tokens ?? []).filter((row) => row.campaign_id === campaign.id && !row.revoked_at && row.submitted_at)
      .length,
    unusedTokens: (tokens ?? [])
      .filter((row) => row.campaign_id === campaign.id && !row.revoked_at && !row.submitted_at)
      .map((row) => ({ id: row.id, hint: row.code_hint, createdAt: row.created_at })),
  }));
  return summaries;
}

export default async function RoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  const selectedId =
    params.school && (schools ?? []).some((s) => s.id === params.school)
      ? params.school
      : (schools?.[0]?.id ?? null);

  const summaries = selectedId ? await loadCampaignSummaries(selectedId) : [];
  const selectedSchool = (schools ?? []).find((s) => s.id === selectedId) ?? null;

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-6">
        <PageHeader
          title="설문 회차 · 참여코드"
          description={
            <>
              회차를 만들고 열면, 교직원에게 줄{" "}
              <strong className="font-medium text-foreground/90">숫자 6자리 참여코드</strong>를 Excel로 발급합니다. 마감
              후 보관함에 접어 두고, 필요할 때만 영구 삭제하세요.
            </>
          }
        />

        {!schools?.length ? (
          <p className="rounded-md border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
            먼저{" "}
            <Link href="/admin" className="font-medium text-primary underline-offset-2 hover:underline">
              학교
            </Link>
            를 만들어 주세요.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="학교 선택">
              {schools.map((school) => (
                <Link
                  key={school.id}
                  href={`/admin/rounds?school=${school.id}`}
                  role="tab"
                  aria-selected={school.id === selectedId}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    school.id === selectedId
                      ? "border-navy/40 bg-navy/10 text-navy"
                      : "border-border/70 bg-card hover:border-navy/25"
                  }`}
                >
                  {school.name}
                </Link>
              ))}
            </div>
            {selectedSchool ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href={`/admin/rounds/new?school=${selectedSchool.id}`}>
                      <Plus className="size-3.5" aria-hidden />
                      새 설문 회차
                    </Link>
                  </Button>
                  <Link
                    href={`/admin/${selectedSchool.id}`}
                    className="text-sm text-primary underline-offset-2 hover:underline"
                  >
                    업무 목록으로
                  </Link>
                </div>
                <CampaignManager schoolId={selectedSchool.id} campaigns={summaries} />
              </div>
            ) : null}
          </>
        )}
      </PageWrap>
    </main>
  );
}
