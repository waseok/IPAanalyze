import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchoolByCode, getTasksBySchoolId } from "@/app/actions";
import { PageWrap } from "@/components/layout/site-chrome";
import { SurveyForm } from "@/components/survey-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ClipboardList } from "lucide-react";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
  if (normalizedCode.length !== 6) notFound();

  const { data: school } = await getSchoolByCode(normalizedCode);
  if (!school) notFound();

  const { data: tasks } = await getTasksBySchoolId(school.id);

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="sm" className="flex flex-col gap-6">
        <header className="space-y-3 border-b border-border/60 pb-6">
          <Badge variant="secondary" className="gap-1 border-primary/25 bg-primary/10 font-normal text-primary">
            <ClipboardList className="size-3" aria-hidden />
            업무 IPA 설문
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">{school.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="size-3.5 text-primary" aria-hidden />
                각 업무의 중요도와 현재 수행도를 1~5점으로 평가합니다.
              </span>
            </p>
          </div>
        </header>

        <Card className="border-border/80 shadow-md ring-1 ring-border/35">
          <CardHeader>
            <CardTitle className="font-heading text-lg">학교 코드</CardTitle>
            <CardDescription>
              코드{" "}
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono font-semibold text-foreground">{school.code}</span> 로 입장한 상태입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!tasks?.length ? (
              <p className="text-sm text-muted-foreground">아직 등록된 업무가 없습니다. 관리자에게 문의해 주세요.</p>
            ) : (
              <SurveyForm
                schoolCode={school.code}
                tasks={tasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          홈으로 돌아가기
        </Link>
      </PageWrap>
    </main>
  );
}
