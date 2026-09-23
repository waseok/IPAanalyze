"use client";

import { useMemo, useState } from "react";
import { saveParticipantSurvey } from "@/app/survey-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  tone,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  /** 중요도=ochre, 수행도=teal — IPA 축과 시각적으로 연결 */
  tone: "importance" | "performance";
}) {
  const activeClass =
    tone === "importance"
      ? "border-ochre/50 bg-ochre text-ink hover:bg-ochre/90"
      : "border-teal/50 bg-teal text-primary-foreground hover:bg-teal/90";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
        {SCALE.map((score) => (
          <Button
            key={score}
            type="button"
            variant="outline"
            className={`h-11 rounded-md px-0 text-base tabular-nums shadow-none ${
              value === score ? activeClass : "bg-card/80"
            }`}
            role="radio"
            aria-checked={value === score}
            onClick={() => onChange(score)}
          >
            {score}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>1 매우 낮음</span>
        <span>3 보통</span>
        <span>5 매우 높음</span>
      </div>
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

  const progress = tasks.length ? completed / tasks.length : 0;

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
      <Alert className="rounded-md border-teal/25 bg-teal/[0.04] shadow-none">
        <CircleHelp className="size-4" />
        <AlertTitle>중요도와 수행도는 이렇게 판단해주세요</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-sm leading-relaxed">
          <p>
            <strong className="text-foreground">중요도</strong>는 이 업무가 학교 운영과 교육활동에 얼마나 중요한지를
            뜻합니다.
          </p>
          <p>
            <strong className="text-foreground">수행도</strong>는 내가 일을 많이 했는지가 아니라, 현재 학교에서 이
            업무가 얼마나 원활하고 효과적으로 이루어지고 있는지를 뜻합니다. 담당 역량, 협업, 지원, 절차, 결과의
            완성도를 함께 떠올려 평가해주세요.
          </p>
          <p className="font-medium text-foreground">1점은 매우 부족함, 3점은 보통, 5점은 매우 잘 수행됨입니다.</p>
        </AlertDescription>
      </Alert>

      <div className="sticky top-0 z-10 space-y-2 rounded-md border border-border/80 bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">평가 진행</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            <strong className="text-teal">{completed}</strong> / {tasks.length}개 완료
          </span>
        </div>
        <div
          className="survey-progress-bar h-1.5 overflow-hidden rounded-sm bg-muted"
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          aria-label="평가 완료 비율"
        >
          <span
            className="block h-full rounded-sm bg-teal transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <ol className="space-y-4">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="scroll-mt-28 space-y-4 rounded-md border border-border/70 bg-card/60 px-4 py-4"
          >
            <h2 className="flex gap-2.5 text-base font-medium leading-snug">
              <span className="font-mono text-sm font-semibold text-teal tabular-nums">{task.position}</span>
              <span>{task.title}</span>
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <RatingButtons
                label="중요도"
                tone="importance"
                value={ratings[task.id].importance}
                onChange={(value) => setScore(task.id, "importance", value)}
              />
              <RatingButtons
                label="수행도"
                tone="performance"
                value={ratings[task.id].performance}
                onChange={(value) => setScore(task.id, "performance", value)}
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="space-y-3 rounded-md border border-teal/20 bg-muted/25 p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-teal" aria-hidden /> 이름과 이메일은 수집하지 않습니다.
        </p>
        {previouslySubmitted ? (
          <p className="flex items-center gap-2 text-sm font-medium text-teal">
            <Gauge className="size-4" aria-hidden /> 기존 응답을 불러왔습니다. 마감 전까지 수정할 수 있습니다.
          </p>
        ) : null}
        <Button
          disabled={busy || completed !== tasks.length}
          type="button"
          size="lg"
          className="h-11 w-full gap-2"
          onClick={() => void onSubmit()}
        >
          <CheckCircle2 className="size-4" aria-hidden />{" "}
          {busy ? "저장 중…" : previouslySubmitted ? "수정한 응답 저장" : "설문 제출"}
        </Button>
        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm font-semibold text-teal" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
