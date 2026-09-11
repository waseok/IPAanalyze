import "server-only";

import { hashParticipantCode, normalizeParticipantCode, PARTICIPANT_CODE_LENGTH } from "@/lib/participant-code";
import { createAdminClient } from "@/lib/supabase/admin";

export const PARTICIPANT_COOKIE = "ipa_participant";

export async function getParticipantSurvey(code: string) {
  const normalized = normalizeParticipantCode(code);
  if (normalized.length !== PARTICIPANT_CODE_LENGTH) return null;

  const admin = createAdminClient();
  const { data: token } = await admin
    .from("participant_tokens")
    .select("id, campaign_id, submitted_at, revoked_at")
    .eq("code_hash", hashParticipantCode(normalized))
    .maybeSingle();
  if (!token || token.revoked_at) return null;

  const { data: campaign } = await admin
    .from("survey_campaigns")
    .select("id, school_id, title, status, opens_at, closes_at")
    .eq("id", token.campaign_id)
    .maybeSingle();
  if (!campaign) return null;

  const [{ data: school }, { data: tasks }, { data: responses }] = await Promise.all([
    admin.from("schools").select("name").eq("id", campaign.school_id).maybeSingle(),
    admin.from("campaign_tasks").select("id, title, position").eq("campaign_id", campaign.id).order("position"),
    admin
      .from("campaign_responses")
      .select("campaign_task_id, importance_score, performance_score")
      .eq("participant_token_id", token.id),
  ]);
  if (!school || !tasks) return null;

  const now = Date.now();
  const starts = campaign.opens_at ? new Date(campaign.opens_at).getTime() : null;
  const closes = campaign.closes_at ? new Date(campaign.closes_at).getTime() : null;
  const accepting =
    campaign.status === "open" &&
    (starts === null || now >= starts) &&
    (closes === null || now < closes);

  const saved = new Map(
    (responses ?? []).map((row) => [
      row.campaign_task_id,
      { importance: row.importance_score, performance: row.performance_score },
    ]),
  );

  return {
    tokenId: token.id,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    schoolName: school.name,
    status: campaign.status,
    opensAt: campaign.opens_at,
    closesAt: campaign.closes_at,
    accepting,
    submitted: Boolean(token.submitted_at),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      position: task.position,
      rating: saved.get(task.id) ?? null,
    })),
  };
}
