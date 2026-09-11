import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/survey-form";
import { PageWrap } from "@/components/layout/site-chrome";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getParticipantSurvey, PARTICIPANT_COOKIE } from "@/lib/campaign-survey";
import { BarChart3, Clock3, ShieldCheck } from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "별도 안내 시까지";
  return new Date(value).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default async function CampaignSurveyPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const code = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!code) notFound();
  const survey = await getParticipantSurvey(code);
  if (!survey || survey.campaignId !== campaignId) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="md" className="flex flex-col gap-6">
        <header className="space-y-3 border-b border-border/60 pb-6">
          <Badge variant="secondary" className="gap-1 border-primary/25 bg-primary/10 font-normal text-primary">
            <BarChart3 className="size-3" aria-hidden /> 업무 IPA 설문
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">{survey.schoolName}</h1>
            <p className="mt-1 font-medium text-primary">{survey.campaignTitle}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> 마감 {formatDate(survey.closesAt)}</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> 이름·이메일을 수집하지 않는 익명 설문</span>
          </div>
        </header>

        {!survey.accepting ? (
          <Alert>
            <Clock3 className="size-4" />
            <AlertTitle>현재 응답할 수 없습니다</AlertTitle>
            <AlertDescription>설문 시작 전이거나 마감된 회차입니다. 관리자 안내를 확인해주세요.</AlertDescription>
          </Alert>
        ) : (
          <Card className="border-border/80 shadow-md ring-1 ring-border/35">
            <CardContent className="pt-6">
              <SurveyForm tasks={survey.tasks} previouslySubmitted={survey.submitted} />
            </CardContent>
          </Card>
        )}
        <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">홈으로 돌아가기</Link>
      </PageWrap>
    </main>
  );
}
