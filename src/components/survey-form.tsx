"use client";

import { useMemo, useState } from "react";
import { saveParticipantSurvey } from "@/app/survey-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleHelp, Gauge, ShieldCheck } from "lucide-react";

type Rating = { importance: number | null; performance: number | null };
type TaskItem = { id: string; title: string; position: number; rating: Rating | null };

type Props = {
  tasks: TaskItem[];
  previouslySubmitted: boolean;
};

const SCALE = [1, 2, 3, 4, 5] as const;

function RatingButtons({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
        {SCALE.map((score) => (
          <Button
            key={score}
            type="button"
            variant={value === score ? "default" : "outline"}
            className="h-11 px-0 text-base tabular-nums"
            role="radio"
            aria-checked={value === score}
            onClick={() => onChange(score)}
          >
            {score}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground"><span>1 매우 낮음</span><span>3 보통</span><span>5 매우 높음</span></div>
    </fieldset>
  );
}

export function SurveyForm({ tasks, previouslySubmitted }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, Rating>>(
    Object.fromEntries(tasks.map((task) => [task.id, task.rating ?? { importance: null, performance: null }])),
  );

  const completed = useMemo(
    () => tasks.filter((task) => ratings[task.id]?.importance !== null && ratings[task.id]?.performance !== null).length,
    [ratings, tasks],
  );

  function setScore(taskId: string, key: keyof Rating, value: number) {
    setRatings((prev) => ({ ...prev, [taskId]: { ...prev[taskId], [key]: value } }));
  }

  async function onSubmit() {
    if (completed !== tasks.length) {
      setError(`아직 ${tasks.length - completed}개 업무의 평가가 남아 있습니다.`);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await saveParticipantSurvey(
      tasks.map((task) => ({
        taskId: task.id,
        importance: ratings[task.id].importance,
        performance: ratings[task.id].performance,
      })),
    );
    setBusy(false);
    if (result.error) setError(result.error);
    else setMessage(result.success ?? "응답을 저장했습니다.");
  }

  return (
    <div className="space-y-6">
      <Alert className="border-primary/25 bg-primary/[0.04]">
        <CircleHelp className="size-4" />
        <AlertTitle>중요도와 수행도는 이렇게 판단해주세요</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-sm leading-relaxed">
          <p><strong className="text-foreground">중요도</strong>는 이 업무가 학교 운영과 교육활동에 얼마나 중요한지를 뜻합니다.</p>
          <p><strong className="text-foreground">수행도</strong>는 내가 일을 많이 했는지가 아니라, 현재 학교에서 이 업무가 얼마나 원활하고 효과적으로 이루어지고 있는지를 뜻합니다. 담당 역량, 협업, 지원, 절차, 결과의 완성도를 함께 떠올려 평가해주세요.</p>
          <p className="font-medium text-foreground">1점은 매우 부족함, 3점은 보통, 5점은 매우 잘 수행됨입니다.</p>
        </AlertDescription>
      </Alert>

      <div className="sticky top-16 z-10 flex items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
        <span className="text-sm font-medium">평가 진행</span>
        <span className="text-sm tabular-nums text-muted-foreground"><strong className="text-primary">{completed}</strong> / {tasks.length}개 완료</span>
      </div>

      {tasks.map((task) => (
        <Card key={task.id} className="scroll-mt-32 border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex gap-2 text-base"><span className="font-mono text-sm text-primary">{task.position}</span><span>{task.title}</span></CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <RatingButtons label="중요도" value={ratings[task.id].importance} onChange={(value) => setScore(task.id, "importance", value)} />
            <RatingButtons label="수행도" value={ratings[task.id].performance} onChange={(value) => setScore(task.id, "performance", value)} />
          </CardContent>
        </Card>
      ))}

      <div className="space-y-3 rounded-xl border border-primary/20 bg-muted/20 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> 이름과 이메일은 수집하지 않습니다.</p>
        {previouslySubmitted ? <p className="flex items-center gap-2 text-sm font-medium text-primary"><Gauge className="size-4" /> 기존 응답을 불러왔습니다. 마감 전까지 수정할 수 있습니다.</p> : null}
        <Button disabled={busy || completed !== tasks.length} type="button" className="w-full gap-2" onClick={() => void onSubmit()}>
          <CheckCircle2 className="size-4" /> {busy ? "저장 중…" : previouslySubmitted ? "수정한 응답 저장" : "설문 제출"}
        </Button>
        {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400" role="status">{message}</p> : null}
      </div>
    </div>
  );
}
