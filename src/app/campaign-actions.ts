"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formatParticipantCode, generateParticipantCode, hashParticipantCode } from "@/lib/participant-code";
import { createClient } from "@/lib/supabase/server";

const campaignSchema = z
  .object({
    schoolId: z.string().uuid(),
    title: z.string().trim().min(1).max(80),
    opensAt: z.string().min(1),
    closesAt: z.string().min(1),
  })
  .refine((value) => new Date(value.closesAt) > new Date(value.opensAt), {
    message: "마감 시각은 시작 시각보다 뒤여야 합니다.",
  });

async function requireOwnedSchool(schoolId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." as const, supabase: null };
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("admin_id", user.id)
    .maybeSingle();
  if (!school) return { error: "권한이 없습니다." as const, supabase: null };
  return { error: null, supabase };
}

async function requireOwnedCampaign(campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." as const, supabase: null, campaign: null };
  const { data: campaign } = await supabase
    .from("survey_campaigns")
    .select("id, school_id, status, title")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return { error: "설문 회차를 찾을 수 없거나 권한이 없습니다." as const, supabase: null, campaign: null };
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", campaign.school_id)
    .eq("admin_id", user.id)
    .maybeSingle();
  if (!school) return { error: "권한이 없습니다." as const, supabase: null, campaign: null };
  return { error: null, supabase, campaign };
}

export async function createSurveyCampaign(formData: FormData) {
  const parsed = campaignSchema.safeParse({
    schoolId: formData.get("schoolId"),
    title: formData.get("title"),
    opensAt: formData.get("opensAt"),
    closesAt: formData.get("closesAt"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };

  const ctx = await requireOwnedSchool(parsed.data.schoolId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error };

  const { error } = await ctx.supabase.from("survey_campaigns").insert({
    school_id: parsed.data.schoolId,
    title: parsed.data.title,
    opens_at: new Date(parsed.data.opensAt).toISOString(),
    closes_at: new Date(parsed.data.closesAt).toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/${parsed.data.schoolId}`);
  revalidatePath("/admin/rounds");
  return { success: "설문 회차를 만들었습니다." };
}

export async function openSurveyCampaign(campaignId: string) {
  const ctx = await requireOwnedCampaign(campaignId);
  if (ctx.error || !ctx.supabase || !ctx.campaign) return { error: ctx.error };
  if (ctx.campaign.status !== "draft") return { error: "초안 상태에서만 설문을 열 수 있습니다." };
  const { error } = await ctx.supabase.rpc("open_survey_campaign", { p_campaign_id: campaignId });
  if (error) return { error: error.message };
  revalidatePath(`/admin/${ctx.campaign.school_id}`);
  return { success: "현재 업무 목록을 고정하고 설문을 열었습니다." };
}

export async function changeSurveyCampaignStatus(campaignId: string, status: "closed" | "archived") {
  const ctx = await requireOwnedCampaign(campaignId);
  if (ctx.error || !ctx.supabase || !ctx.campaign) return { error: ctx.error };
  if (status === "closed" && ctx.campaign.status !== "open") return { error: "진행 중인 설문만 마감할 수 있습니다." };
  if (status === "archived" && ctx.campaign.status !== "closed") return { error: "마감된 설문만 보관할 수 있습니다." };
  const { error } = await ctx.supabase
    .from("survey_campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${ctx.campaign.school_id}`);
  revalidatePath(`/admin/${ctx.campaign.school_id}/results`);
  return { success: status === "closed" ? "설문을 마감했습니다." : "설문을 보관했습니다." };
}

export async function generateParticipantCodes(campaignId: string, count: number) {
  const parsedCount = z.number().int().min(1).max(200).safeParse(count);
  if (!parsedCount.success) return { error: "참여코드는 1~200개까지 생성할 수 있습니다." };
  const ctx = await requireOwnedCampaign(campaignId);
  if (ctx.error || !ctx.supabase || !ctx.campaign) return { error: ctx.error };
  if (!['draft', 'open'].includes(ctx.campaign.status)) return { error: "초안 또는 진행 중 회차에서만 코드를 만들 수 있습니다." };

  const { count: activeCount, error: countError } = await ctx.supabase
    .from("participant_tokens")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .is("revoked_at", null);
  if (countError) return { error: countError.message };
  if ((activeCount ?? 0) + parsedCount.data > 200) {
    return { error: `회차당 유효 참여코드는 최대 200개입니다. 현재 ${activeCount ?? 0}개가 있습니다.` };
  }

  const codes = Array.from({ length: parsedCount.data }, () => generateParticipantCode());
  const rows = codes.map((code) => ({
    campaign_id: campaignId,
    code_hash: hashParticipantCode(code),
    code_hint: code.slice(-4),
  }));
  const { error } = await ctx.supabase.from("participant_tokens").insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${ctx.campaign.school_id}`);
  return {
    success: `${codes.length}개의 참여코드를 생성했습니다. 이 파일은 다시 내려받을 수 없습니다.`,
    campaignTitle: ctx.campaign.title,
    codes: codes.map((code, index) => ({
      number: index + 1,
      code: formatParticipantCode(code),
      path: `/join/${code}`,
    })),
  };
}

export async function revokeParticipantToken(campaignId: string, tokenId: string) {
  const ctx = await requireOwnedCampaign(campaignId);
  if (ctx.error || !ctx.supabase || !ctx.campaign) return { error: ctx.error };
  const { data: token } = await ctx.supabase
    .from("participant_tokens")
    .select("id, submitted_at, revoked_at")
    .eq("id", tokenId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!token) return { error: "참여코드를 찾을 수 없습니다." };
  if (token.submitted_at) return { error: "이미 제출된 참여코드는 폐기할 수 없습니다." };
  if (token.revoked_at) return { success: "이미 폐기된 참여코드입니다." };

  const { error } = await ctx.supabase
    .from("participant_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("campaign_id", campaignId)
    .is("submitted_at", null);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${ctx.campaign.school_id}`);
  return { success: "미사용 참여코드를 폐기했습니다." };
}

export async function deleteArchivedCampaign(campaignId: string) {
  const ctx = await requireOwnedCampaign(campaignId);
  if (ctx.error || !ctx.supabase || !ctx.campaign) return { error: ctx.error };
  if (ctx.campaign.status !== "archived") return { error: "보관된 회차만 영구 삭제할 수 있습니다." };
  const { error } = await ctx.supabase.from("survey_campaigns").delete().eq("id", campaignId).eq("status", "archived");
  if (error) return { error: error.message };
  revalidatePath(`/admin/${ctx.campaign.school_id}`);
  revalidatePath(`/admin/${ctx.campaign.school_id}/results`);
  return { success: "회차와 익명 응답 데이터를 영구 삭제했습니다." };
}
