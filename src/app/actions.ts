"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildIpaResult, type TaskAggregate } from "@/lib/ipa";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LIKERT_MAX, LIKERT_MIN } from "@/lib/constants";
import { parseDocumentToTaskTitles } from "@/lib/roster-document";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signInAdmin(formData: FormData) {
  const parsed = authSchema.safeParse({
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
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "이메일/비밀번호 형식을 확인해주세요." };

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

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
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

  const { error: deleteError } = await supabase.from("tasks").delete().eq("school_id", schoolId);
  if (deleteError) return { error: deleteError.message };

  const rows = titles.map((title, index) => ({
    school_id: schoolId,
    title,
    position: index + 1,
  }));

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/admin/${schoolId}`);
  revalidatePath(`/admin/${schoolId}/results`);
  return { success: `${rows.length}개 업무를 업로드했습니다.` };
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

export async function deleteTask(schoolId: string, taskId: string) {
  const ctx = await assertSchoolAdmin(schoolId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error };

  const { data: task } = await ctx.supabase.from("tasks").select("id").eq("id", taskId).eq("school_id", schoolId).maybeSingle();
  if (!task) return { error: "업무를 찾을 수 없습니다." };

  // 이미 제출된 설문 응답 중 이 업무에 해당하는 행 제거 → IPA·설문 상세 집계에서 제외 (FK CASCADE와 동일 목적, RLS DELETE 정책 필요)
  const { error: respDelErr } = await ctx.supabase
    .from("responses")
    .delete()
    .eq("task_id", taskId)
    .eq("school_id", schoolId);
  if (respDelErr) return { error: respDelErr.message };

  const { error: delErr } = await ctx.supabase.from("tasks").delete().eq("id", taskId).eq("school_id", schoolId);
  if (delErr) return { error: delErr.message };

  const { data: rest, error: listErr } = await ctx.supabase.from("tasks").select("id").eq("school_id", schoolId).order("position", { ascending: true });
  if (listErr) return { error: listErr.message };

  for (let i = 0; i < (rest ?? []).length; i += 1) {
    const row = rest![i];
    const { error: upErr } = await ctx.supabase.from("tasks").update({ position: i + 1 }).eq("id", row.id);
    if (upErr) return { error: upErr.message };
  }

  revalidatePath(`/admin/${schoolId}`);
  revalidatePath(`/admin/${schoolId}/results`);
  return { success: "삭제했습니다." };
}

/** PDF / Excel 업무분장 — 규칙 기반 파싱 후 필요 시 LLM 정리 */
export async function parseAndUploadRosterDocument(schoolId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "파일을 선택해주세요." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["pdf", "xlsx", "xls"].includes(ext)) {
    return { error: "PDF 또는 Excel(.xlsx, .xls)만 업로드할 수 있습니다." };
  }

  try {
    const buffer = await file.arrayBuffer();
    const { titles, usedLlm } = await parseDocumentToTaskTitles(buffer, file.name);
    const result = await uploadTasks(schoolId, titles);
    if (result?.error) return result;
    const suffix = usedLlm ? " (규칙만으로 어려워 AI로 목록을 정리했습니다.)" : "";
    return { success: `${result.success}${suffix}`, usedLlm };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "문서 처리 중 오류가 발생했습니다." };
  }
}

const submitSurveySchema = z.object({
  schoolCode: z.string().regex(/^\d{6}$/),
  teacherLabel: z.string().trim().max(40).optional(),
  ratings: z.array(
    z.object({
      taskId: z.string().uuid(),
      importance: z.number().int().min(LIKERT_MIN).max(LIKERT_MAX),
      performance: z.number().int().min(LIKERT_MIN).max(LIKERT_MAX),
    }),
  ),
});

const updateSchoolCodeSchema = z.object({
  schoolId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export async function updateSchoolCode(formData: FormData) {
  const parsed = updateSchoolCodeSchema.safeParse({
    schoolId: formData.get("schoolId"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "학교 코드는 숫자 6자리여야 합니다." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("schools")
    .update({ code: parsed.data.code })
    .eq("id", parsed.data.schoolId)
    .eq("admin_id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 학교 코드입니다." };
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${parsed.data.schoolId}`);
  revalidatePath(`/admin/${parsed.data.schoolId}/results`);
  return { success: "학교 코드가 수정되었습니다." };
}

export async function submitSurvey(input: z.infer<typeof submitSurveySchema>) {
  const parsed = submitSurveySchema.safeParse(input);
  if (!parsed.success) return { error: "설문 데이터 형식이 올바르지 않습니다." };

  const admin = createAdminClient();
  const { data: school } = await admin.from("schools").select("id").eq("code", parsed.data.schoolCode).maybeSingle();
  if (!school) return { error: "유효하지 않은 학교 코드입니다." };

  const { data: session, error: sessionError } = await admin
    .from("survey_sessions")
    .insert({ school_id: school.id, teacher_label: parsed.data.teacherLabel ?? null, submitted_at: new Date().toISOString() })
    .select("id")
    .single();
  if (sessionError || !session) return { error: sessionError?.message ?? "세션 생성 실패" };

  const payload = parsed.data.ratings.map((r) => ({
    school_id: school.id,
    task_id: r.taskId,
    survey_session_id: session.id,
    importance_score: r.importance,
    performance_score: r.performance,
  }));
  const { error } = await admin.from("responses").insert(payload);
  if (error) return { error: error.message };
  return { success: "설문이 제출되었습니다." };
}

export async function getSchoolByCode(code: string) {
  const admin = createAdminClient();
  return admin.from("schools").select("id, name, code").eq("code", code).maybeSingle();
}

export async function getTasksBySchoolId(schoolId: string) {
  const admin = createAdminClient();
  return admin.from("tasks").select("id, title, position").eq("school_id", schoolId).order("position");
}

/**
 * IPA 집계: 로그인한 학교 관리자 세션으로 조회(RLS).
 * 서비스 롤 키 없이도 동작하게 하고, 업무 수만큼 반복 쿼리(N+1)를 피합니다.
 */
export async function getIpaForSchool(schoolId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const { data: owned, error: ownErr } = await supabase
      .from("schools")
      .select("id")
      .eq("id", schoolId)
      .eq("admin_id", user.id)
      .maybeSingle();
    if (ownErr) return { error: ownErr.message };
    if (!owned) return { error: "학교를 찾을 수 없거나 권한이 없습니다." };

    const { data: tasks, error: taskError } = await supabase.from("tasks").select("id, title").eq("school_id", schoolId);
    if (taskError) return { error: taskError.message };
    if (!tasks?.length) return { data: buildIpaResult([], "average") };

    const { data: respRows, error: respErr } = await supabase
      .from("responses")
      .select("task_id, importance_score, performance_score")
      .eq("school_id", schoolId);
    if (respErr) return { error: respErr.message };

    const byTask = new Map<string, { imp: number[]; perf: number[] }>();
    for (const row of respRows ?? []) {
      const tid = row.task_id as string;
      let bucket = byTask.get(tid);
      if (!bucket) {
        bucket = { imp: [], perf: [] };
        byTask.set(tid, bucket);
      }
      bucket.imp.push(row.importance_score);
      bucket.perf.push(row.performance_score);
    }

    const aggregates: TaskAggregate[] = tasks.map((task) => {
      const bucket = byTask.get(task.id);
      if (!bucket || bucket.imp.length === 0) {
        return {
          taskId: task.id,
          title: task.title,
          avgImportance: 0,
          avgPerformance: 0,
          responseCount: 0,
        };
      }
      const n = bucket.imp.length;
      return {
        taskId: task.id,
        title: task.title,
        avgImportance: bucket.imp.reduce((a, b) => a + b, 0) / n,
        avgPerformance: bucket.perf.reduce((a, b) => a + b, 0) / n,
        responseCount: n,
      };
    });

    return { data: buildIpaResult(aggregates, "average") };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "IPA 결과를 불러오지 못했습니다." };
  }
}

export type SurveySessionReportItem = {
  id: string;
  teacherLabel: string | null;
  submittedAt: string | null;
  rows: Array<{ taskTitle: string; importance: number; performance: number }>;
};

/** 제출 설문 목록(관리자 보고서용). 세션별 응답 행 포함 */
export async function getSurveySessionsReport(schoolId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "로그인이 필요합니다." };

    const { data: owned, error: oErr } = await supabase
      .from("schools")
      .select("id")
      .eq("id", schoolId)
      .eq("admin_id", user.id)
      .maybeSingle();
    if (oErr) return { error: oErr.message };
    if (!owned) return { error: "권한이 없습니다." };

    const { data: sessions, error: sErr } = await supabase
      .from("survey_sessions")
      .select("id, teacher_label, submitted_at, created_at")
      .eq("school_id", schoolId)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (sErr) return { error: sErr.message };

    const { data: respRows, error: rErr } = await supabase
      .from("responses")
      .select(`
        survey_session_id,
        importance_score,
        performance_score,
        tasks ( title )
      `)
      .eq("school_id", schoolId);
    if (rErr) return { error: rErr.message };

    const bySession = new Map<string, Array<{ taskTitle: string; importance: number; performance: number }>>();
    for (const row of respRows ?? []) {
      const sid = row.survey_session_id as string;
      const taskTitle =
        row.tasks && typeof row.tasks === "object" && row.tasks !== null && "title" in row.tasks
          ? String((row.tasks as { title: string }).title)
          : "업무";
      const arr = bySession.get(sid) ?? [];
      arr.push({
        taskTitle,
        importance: row.importance_score,
        performance: row.performance_score,
      });
      bySession.set(sid, arr);
    }

    const items: SurveySessionReportItem[] = (sessions ?? []).map((s) => ({
      id: s.id,
      teacherLabel: s.teacher_label,
      submittedAt: s.submitted_at,
      rows: bySession.get(s.id) ?? [],
    }));

    return { data: { participantCount: items.length, sessions: items } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "설문 목록을 불러오지 못했습니다." };
  }
}

export async function deleteSurveySession(schoolId: string, sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: owned } = await supabase
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("admin_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "권한이 없습니다." };

  const { error } = await supabase.from("survey_sessions").delete().eq("id", sessionId).eq("school_id", schoolId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/${schoolId}/results`);
  revalidatePath(`/admin/${schoolId}`);
  return { success: "해당 설문을 삭제했습니다." };
}
