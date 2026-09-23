"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseDocumentToTaskTitles } from "@/lib/roster-document";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const strongPasswordSchema = z
  .string()
  .min(12)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);
const signUpSchema = signInSchema.extend({ password: strongPasswordSchema });

function isAllowedAdminEmail(email: string) {
  const allowed = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function signInAdmin(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: "이메일/비밀번호 형식을 확인해주세요." };

  const supabase = await createClient();
  // 남아 있는 손상된 리프레시 토큰 쿠키로 갱신을 시도하면 "Refresh Token Not Found" 등이 날 수 있음 → 새 로그인 전 정리
  await supabase.auth.signOut().catch(() => undefined);
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect("/admin");
}

export async function signUpAdmin(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "비밀번호는 12자 이상이며 영문 대·소문자와 숫자를 포함해야 합니다." };
  if (!isAllowedAdminEmail(parsed.data.email)) return { error: "승인된 관리자 이메일이 아닙니다." };

  // 이메일 인증 단계를 생략하기 위해 관리자 API로 즉시 확인된 사용자 생성
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (createError) return { error: createError.message };

  // 생성 직후 일반 인증으로 로그인해 세션 쿠키를 설정
  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => undefined);
  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
  if (signInError) return { error: signInError.message };

  redirect("/admin");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success || !isAllowedAdminEmail(email)) {
    return { success: "승인된 계정이라면 비밀번호 재설정 메일을 전송했습니다." };
  }
  const supabase = await createClient();
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/auth/callback?next=/auth/reset` });
  return { success: "승인된 계정이라면 비밀번호 재설정 메일을 전송했습니다." };
}


export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateAdminPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!strongPasswordSchema.safeParse(password).success) {
    return { error: "비밀번호는 12자 이상이며 영문 대·소문자와 숫자를 포함해야 합니다." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "재설정 링크가 만료되었습니다. 메일을 다시 요청해주세요." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/admin");
}

async function generateUniqueCode() {
  const admin = createAdminClient();
  for (let i = 0; i < 20; i += 1) {
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const { data } = await admin.from("schools").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("학교 코드를 생성하지 못했습니다.");
}

export async function createSchool(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "학교명을 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const code = await generateUniqueCode();
  const { error } = await supabase.from("schools").insert({
    name,
    code,
    admin_id: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: "학교 워크스페이스가 생성되었습니다." };
}

export async function uploadTasks(schoolId: string, titles: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: school } = await supabase.from("schools").select("id").eq("id", schoolId).eq("admin_id", user.id).maybeSingle();
  if (!school) return { error: "권한이 없습니다." };

  const { error } = await supabase.rpc("replace_school_tasks", { p_school_id: schoolId, p_titles: titles });
  if (error) return { error: error.message };
  revalidatePath(`/admin/${schoolId}`);
  revalidatePath(`/admin/${schoolId}/results`);
  return { success: `${titles.length}개 업무를 업로드했습니다.` };
}

async function assertSchoolAdmin(schoolId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null as null, user: null, error: "로그인이 필요합니다." as const };

  const { data: school } = await supabase.from("schools").select("id").eq("id", schoolId).eq("admin_id", user.id).maybeSingle();
  if (!school) return { supabase: null as null, user: null, error: "권한이 없습니다." as const };

  return { supabase, user, error: null as null };
}

export async function addTask(schoolId: string, title: string) {
  const t = title.trim();
  if (!t) return { error: "업무명을 입력해주세요." };

  const ctx = await assertSchoolAdmin(schoolId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error };

  const { data: maxRow } = await ctx.supabase
    .from("tasks")
    .select("position")
    .eq("school_id", schoolId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = (maxRow?.position ?? 0) + 1;

  const { error } = await ctx.supabase.from("tasks").insert({
    school_id: schoolId,
    title: t,
    position: nextPos,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/${schoolId}`);
  revalidatePath(`/admin/${schoolId}/results`);
  return { success: "업무를 추가했습니다." };
}

export async function updateTaskTitle(schoolId: string, taskId: string, title: string) {
  const t = title.trim();
  if (!t) return { error: "업무명을 입력해주세요." };

  const ctx = await assertSchoolAdmin(schoolId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error };

  const { data: task } = await ctx.supabase.from("tasks").select("id").eq("id", taskId).eq("school_id", schoolId).maybeSingle();
  if (!task) return { error: "업무를 찾을 수 없습니다." };

  const { error } = await ctx.supabase.from("tasks").update({ title: t }).eq("id", taskId).eq("school_id", schoolId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${schoolId}`);
  revalidatePath(`/admin/${schoolId}/results`);
  return { success: "저장했습니다." };
}

async function deleteTasksAndRenumber(schoolId: string, taskIds: string[]) {
  const ctx = await assertSchoolAdmin(schoolId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error };

  const uniqueIds = [...new Set(taskIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { error: "삭제할 업무를 선택해주세요." };

  const { data: owned, error: ownedErr } = await ctx.supabase
    .from("tasks")
    .select("id")
    .eq("school_id", schoolId)
    .in("id", uniqueIds);
  if (ownedErr) return { error: ownedErr.message };
  if (!owned?.length) return { error: "업무를 찾을 수 없습니다." };
  if (owned.length !== uniqueIds.length) return { error: "일부 업무를 찾을 수 없거나 권한이 없습니다." };

  const ids = owned.map((row) => row.id);

  // 이미 제출된 설문 응답 중 이 업무에 해당하는 행 제거 → IPA·설문 상세 집계에서 제외
  const { error: respDelErr } = await ctx.supabase
    .from("responses")
    .delete()
    .in("task_id", ids)
    .eq("school_id", schoolId);
  if (respDelErr) return { error: respDelErr.message };

  const { error: delErr } = await ctx.supabase.from("tasks").delete().eq("school_id", schoolId).in("id", ids);
  if (delErr) return { error: delErr.message };

  const { data: rest, error: listErr } = await ctx.supabase
    .from("tasks")
    .select("id")
    .eq("school_id", schoolId)
    .order("position", { ascending: true });
  if (listErr) return { error: listErr.message };

  for (let i = 0; i < (rest ?? []).length; i += 1) {
    const row = rest![i];
    const { error: upErr } = await ctx.supabase.from("tasks").update({ position: i + 1 }).eq("id", row.id);
    if (upErr) return { error: upErr.message };
  }

  revalidatePath(`/admin/${schoolId}`);
  revalidatePath(`/admin/${schoolId}/results`);
  return { success: ids.length === 1 ? "삭제했습니다." : `${ids.length}개 업무를 삭제했습니다.` };
}

export async function deleteTask(schoolId: string, taskId: string) {
  return deleteTasksAndRenumber(schoolId, [taskId]);
}

/** 선택한 여러 업무를 한 번에 삭제하고 position을 다시 맞춥니다. */
export async function deleteTasks(schoolId: string, taskIds: string[]) {
  return deleteTasksAndRenumber(schoolId, taskIds);
}

/** PDF / Excel 업무분장 — 개인정보를 외부로 보내지 않고 규칙 기반으로 파싱 */
export async function parseAndUploadRosterDocument(schoolId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "파일을 선택해주세요." };

  if (file.size > 10 * 1024 * 1024) return { error: "파일은 10MB 이하만 업로드할 수 있습니다." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["pdf", "xlsx", "xls"].includes(ext)) {
    return { error: "PDF 또는 Excel(.xlsx, .xls)만 업로드할 수 있습니다." };
  }

  const allowedTypes = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
    "",
  ]);
  if (!allowedTypes.has(file.type)) return { error: "파일 형식을 확인해주세요." };

  try {
    const buffer = await file.arrayBuffer();
    const { titles } = await parseDocumentToTaskTitles(buffer, file.name);
    const result = await uploadTasks(schoolId, titles);
    if (result?.error) return result;
    return { success: result.success };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "문서 처리 중 오류가 발생했습니다." };
  }
}
