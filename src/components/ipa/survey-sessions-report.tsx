"use client";

import { deleteSurveySession } from "@/app/actions";
import type { SurveySessionReportItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  schoolId: string;
  sessions: SurveySessionReportItem[];
};

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function SurveySessionsReport({ schoolId, sessions }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onDelete(id: string) {
    if (!window.confirm("이 설문 응답을 삭제할까요? 집계·IPA 수치에서 제외됩니다.")) return;
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteSurveySession(schoolId, id);
      setDeletingId(null);
      if (res && "error" in res) {
        window.alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        아직 제출된 설문이 없습니다. 교직원에게 학교 코드로 설문 링크를 공유하세요.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s, idx) => {
        const expanded = open.has(s.id);
        const busy = pending && deletingId === s.id;
        return (
          <div
            key={s.id}
            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-border/40"
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 font-normal"
                onClick={() => toggle(s.id)}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span className="font-mono text-xs text-muted-foreground">#{sessions.length - idx}</span>
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {s.teacherLabel?.trim() ? s.teacherLabel : "응답자 표시 없음"}
                </p>
                <p className="text-xs text-muted-foreground">제출 {formatWhen(s.submittedAt)} · 문항 {s.rows.length}개</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={busy}
                onClick={() => onDelete(s.id)}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                <span className="ml-1 hidden sm:inline">삭제</span>
              </Button>
            </div>

            {expanded ? (
              <div className="border-t border-border/60 bg-muted/15 px-3 py-3 sm:px-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[45%]">업무</TableHead>
                      <TableHead className="text-center">중요도</TableHead>
                      <TableHead className="text-center">수행도</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.rows.map((r, i) => (
                      <TableRow key={`${s.id}-${i}`}>
                        <TableCell className="max-w-[min(100%,28rem)] whitespace-normal font-medium">{r.taskTitle}</TableCell>
                        <TableCell className="text-center tabular-nums">{r.importance}</TableCell>
                        <TableCell className="text-center tabular-nums">{r.performance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
