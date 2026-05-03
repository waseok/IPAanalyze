"use client";

import { useState } from "react";
import { submitSurvey } from "@/app/actions";
import { LIKERT_MAX, LIKERT_MIN } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TaskItem = {
  id: string;
  title: string;
};

type Props = {
  schoolCode: string;
  tasks: TaskItem[];
};

export function SurveyForm({ schoolCode, tasks }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, { importance: number; performance: number }>>(
    Object.fromEntries(tasks.map((task) => [task.id, { importance: 3, performance: 3 }])),
  );

  async function onSubmit(formData: FormData) {
    const teacherLabel = String(formData.get("teacherLabel") ?? "").trim();
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await submitSurvey({
      schoolCode,
      teacherLabel,
      ratings: tasks.map((task) => ({
        taskId: task.id,
        importance: ratings[task.id].importance,
        performance: ratings[task.id].performance,
      })),
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage(result.success ?? "제출되었습니다.");
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="teacherLabel">응답자 이름/직책 (선택)</Label>
        <Input id="teacherLabel" name="teacherLabel" placeholder="예: 5학년 담임 김OO" />
      </div>
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle className="text-base">{task.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>중요도 ({ratings[task.id].importance})</Label>
              <Input
                type="range"
                min={LIKERT_MIN}
                max={LIKERT_MAX}
                step={1}
                value={ratings[task.id].importance}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    [task.id]: { ...prev[task.id], importance: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>수행도 ({ratings[task.id].performance})</Label>
              <Input
                type="range"
                min={LIKERT_MIN}
                max={LIKERT_MAX}
                step={1}
                value={ratings[task.id].performance}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    [task.id]: { ...prev[task.id], performance: Number(e.target.value) },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button disabled={busy} type="submit">
        {busy ? "제출 중..." : "설문 제출"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-600">{message}</p> : null}
    </form>
  );
}
