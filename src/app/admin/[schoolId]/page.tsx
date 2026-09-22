import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageWrap } from "@/components/layout/site-chrome";
import { TaskListEditor } from "@/components/task-list-editor";
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
    .select("id, name")
    .eq("id", schoolId)
    .eq("admin_id", user.id)
    .maybeSingle();
  if (!school) notFound();

  const { data: tasks } = await supabase.from("tasks").select("id, title, position").eq("school_id", schoolId).order("position");

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{school.name}</h1>
          <Button asChild variant="outline">
            <Link href="/admin">목록으로</Link>
          </Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild className="h-10 font-semibold">
            <Link href={`/admin/${school.id}/upload`}>업무 일괄 업로드</Link>
          </Button>
          <Button asChild variant="secondary" className="h-10 font-semibold">
            <Link href={`/admin/rounds?school=${school.id}`}>설문 회차 · 참여코드</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 font-semibold">
            <Link href={`/admin/${school.id}/results`}>IPA 결과</Link>
          </Button>
        </div>

        <Card className="border-primary/20 shadow-md ring-1 ring-primary/10">
          <CardHeader className="border-b border-border/50 bg-primary/[0.06] pb-4 dark:bg-primary/10">
            <CardTitle className={`${sectionTitleClass} border-primary`}>업무 목록</CardTitle>
            <CardDescription>
              설문 문항이 되는 업무입니다. 회차·참여코드는{" "}
              <Link href={`/admin/rounds?school=${school.id}`} className="font-semibold text-primary underline underline-offset-2">
                설문 회차
              </Link>
              메뉴에서 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <TaskListEditor
              schoolId={school.id}
              tasks={(tasks ?? []).map((task, index) => ({ ...task, position: task.position ?? index + 1 }))}
            />
          </CardContent>
        </Card>
      </PageWrap>
    </main>
  );
}
