import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageWrap } from "@/components/layout/site-chrome";
import { TaskListEditor } from "@/components/task-list-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateSchoolCodeForm } from "@/components/update-school-code-form";
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

  const { data: tasks } = await supabase.from("tasks").select("id, title, position").eq("school_id", schoolId).order("position");
  const surveyLink = `/s/${school.code}`;

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{school.name}</h1>
        <Button asChild variant="outline">
          <Link href="/admin">목록으로</Link>
        </Button>
      </header>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className={sectionTitleClass}>설문 공유 정보</CardTitle>
          <CardDescription className="text-muted-foreground">교직원에게 안내할 코드와 링크입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-foreground/90">
          <p>
            <span className="font-semibold text-primary">학교 코드</span>{" "}
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium">{school.code}</span>
          </p>
          <p>
            <span className="font-semibold text-primary">설문 링크</span>{" "}
            <Link href={surveyLink} className="font-medium text-chart-2 underline underline-offset-2 hover:text-chart-2/90">
              {surveyLink}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className={sectionTitleClass}>학교 코드 수정</CardTitle>
          <CardDescription>6자리 숫자 코드를 변경하면 설문 URL 경로도 함께 바뀝니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateSchoolCodeForm schoolId={school.id} currentCode={school.code} />
        </CardContent>
      </Card>

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
          <TaskListEditor schoolId={school.id} tasks={tasks ?? []} />
        </CardContent>
      </Card>
      </PageWrap>
    </main>
  );
}
