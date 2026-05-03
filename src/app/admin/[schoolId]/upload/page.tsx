import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageWrap } from "@/components/layout/site-chrome";
import { TaskUploadForm } from "@/components/task-upload-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, ChevronLeft } from "lucide-react";

export default async function UploadPage({
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

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="sm" className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 font-normal">
                <BarChart3 className="size-3" aria-hidden />
                데이터 입력
              </Badge>
              <span className="text-xs text-muted-foreground">IPA · 중요도·수행도 매트릭스</span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {school.name}
              <span className="block text-base font-semibold text-primary md:inline md:before:mx-2 md:before:content-['·']">
                업무 일괄 업로드
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              설문에 노출될 업무를 <strong className="font-semibold text-foreground/90">PDF·Excel</strong>로 일괄 반영합니다. 개별 추가·수정·삭제는 학교 대시보드의{" "}
              <strong className="font-semibold text-primary">업무 목록</strong>에서 하세요.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-1 self-start sm:self-auto">
            <Link href={`/admin/${schoolId}`}>
              <ChevronLeft className="size-4" aria-hidden />
              학교 대시보드
            </Link>
          </Button>
        </header>

        <Card className="border-primary/20 shadow-md ring-1 ring-primary/10">
          <CardHeader className="border-b border-border/50 bg-primary/[0.07] pb-4 dark:bg-primary/10">
            <CardTitle className="border-l-4 border-primary pl-3 text-lg font-bold tracking-tight text-foreground">
              문서에서 업무 불러오기
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              PDF·Excel 업무분장(규칙 우선, 필요 시 AI) · <span className="font-semibold text-primary">엑셀 양식 다운로드</span> 가능
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <TaskUploadForm schoolId={schoolId} />
          </CardContent>
        </Card>
      </PageWrap>
    </main>
  );
}
