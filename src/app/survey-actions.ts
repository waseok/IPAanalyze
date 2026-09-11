"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { PARTICIPANT_COOKIE } from "@/lib/campaign-survey";
import { hashParticipantCode } from "@/lib/participant-code";
import { createAdminClient } from "@/lib/supabase/admin";

const ratingsSchema = z.array(
  z.object({
    taskId: z.string().uuid(),
    importance: z.number().int().min(1).max(5),
    performance: z.number().int().min(1).max(5),
  }),
).min(1).max(220);

export async function saveParticipantSurvey(input: unknown) {
  const parsed = ratingsSchema.safeParse(input);
  if (!parsed.success) return { error: "모든 업무의 중요도와 수행도를 선택해주세요." };
  const code = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!code) return { error: "참여 인증이 만료되었습니다. 참여코드로 다시 접속해주세요." };

  const admin = createAdminClient();
  const { error } = await admin.rpc("save_campaign_response", {
    p_code_hash: hashParticipantCode(code),
    p_ratings: parsed.data,
  });
  if (error) return { error: error.message };
  return { success: "응답을 저장했습니다. 설문 마감 전까지 같은 코드로 수정할 수 있습니다." };
}
