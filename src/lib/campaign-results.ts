import "server-only";

import { buildIpaResult, type TaskAggregate } from "@/lib/ipa";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

export type AnonymousResponse = {
  tokenId: string;
  respondentNumber: number;
  submittedAt: string;
  ratings: Array<{ taskId: string; title: string; importance: number; performance: number }>;
};

export async function getCampaignReport(campaignId: string) {
  const supabase = await createClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("survey_campaigns")
    .select("id, school_id, title, status, opens_at, closes_at")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError || !campaign) return { error: campaignError?.message ?? "설문 회차를 찾을 수 없습니다." };

  const [{ data: tasks, error: taskError }, { data: tokens, error: tokenError }] = await Promise.all([
    supabase.from("campaign_tasks").select("id, title, position").eq("campaign_id", campaignId).order("position"),
    supabase.from("participant_tokens").select("id, submitted_at, revoked_at").eq("campaign_id", campaignId).order("submitted_at", { ascending: true }),
  ]);
  const error = taskError ?? tokenError;
  if (error) return { error: error.message };

  type ResponseRow = Pick<
    Database["public"]["Tables"]["campaign_responses"]["Row"],
    "participant_token_id" | "campaign_task_id" | "importance_score" | "performance_score"
  >;
  const responses: ResponseRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data: page, error: responseError } = await supabase
      .from("campaign_responses")
      .select("participant_token_id, campaign_task_id, importance_score, performance_score")
      .eq("campaign_id", campaignId)
      .range(from, from + pageSize - 1);
    if (responseError) return { error: responseError.message };
    responses.push(...(page ?? []));
    if (!page || page.length < pageSize) break;
  }

  const activeTokens = (tokens ?? []).filter((token) => !token.revoked_at);
  const submittedTokens = activeTokens.filter((token): token is typeof token & { submitted_at: string } => Boolean(token.submitted_at));
  const submittedIds = new Set(submittedTokens.map((token) => token.id));
  const submittedResponses = responses.filter((row) => submittedIds.has(row.participant_token_id));
  const taskById = new Map((tasks ?? []).map((task) => [task.id, task]));

  const aggregates: TaskAggregate[] = (tasks ?? []).map((task) => {
    const rows = submittedResponses.filter((row) => row.campaign_task_id === task.id);
    const count = rows.length;
    return {
      taskId: task.id,
      title: task.title,
      avgImportance: count ? rows.reduce((sum, row) => sum + row.importance_score, 0) / count : 0,
      avgPerformance: count ? rows.reduce((sum, row) => sum + row.performance_score, 0) / count : 0,
      responseCount: count,
    };
  });

  const anonymousResponses: AnonymousResponse[] = submittedTokens.map((token, index) => ({
    tokenId: token.id,
    respondentNumber: index + 1,
    submittedAt: token.submitted_at,
    ratings: submittedResponses
      .filter((row) => row.participant_token_id === token.id)
      .map((row) => ({
        taskId: row.campaign_task_id,
        title: taskById.get(row.campaign_task_id)?.title ?? "업무",
        importance: row.importance_score,
        performance: row.performance_score,
      })),
  }));

  return {
    data: {
      campaign,
      ipa: buildIpaResult(aggregates, "average"),
      taskTotal: tasks?.length ?? 0,
      tokenTotal: activeTokens.length,
      participantCount: submittedTokens.length,
      anonymousResponses,
    },
  };
}
