"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { addTask, deleteTask, deleteTasks, updateTaskTitle } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export type TaskRow = {
  id: string;
  title: string;
  position: number;
};

type Props = {
  schoolId: string;
  tasks: TaskRow[];
};

export function TaskListEditor({ schoolId, tasks }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const allSelected = useMemo(
    () => tasks.length > 0 && tasks.every((task) => selectedIds.has(task.id)),
    [tasks, selectedIds],
  );
  const selectedCount = selectedIds.size;

  function toggleOne(taskId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(tasks.map((task) => task.id)) : new Set());
  }

  async function handleBlurUpdate(taskId: string, previousTitle: string, value: string) {
    const next = value.trim();
    if (next === previousTitle.trim()) return;
    if (!next) {
      setError("업무명은 비울 수 없습니다. 삭제 버튼을 이용해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateTaskTitle(schoolId, taskId, next);
    if (result?.error) setError(result.error);
    else refresh();
    setBusy(false);
  }

  async function handleDelete(taskId: string) {
    if (
      !window.confirm(
        "이 업무를 삭제하면, 이미 제출된 설문에서 이 업무에 대한 평가(응답)도 함께 삭제되어 IPA 결과·설문 상세에서 빠집니다. 계속할까요?",
      )
    )
      return;
    setBusy(true);
    setError(null);
    const result = await deleteTask(schoolId, taskId);
    if (result?.error) setError(result.error);
    else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      refresh();
    }
    setBusy(false);
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `선택한 ${ids.length}개 업무를 삭제하면, 이미 제출된 설문에서 해당 업무 평가(응답)도 함께 삭제되어 IPA 결과·설문 상세에서 빠집니다. 계속할까요?`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    const result = await deleteTasks(schoolId, ids);
    if (result?.error) setError(result.error);
    else {
      setSelectedIds(new Set());
      refresh();
    }
    setBusy(false);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const t = newTitle.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    const result = await addTask(schoolId, t);
    if (result?.error) setError(result.error);
    else {
      setNewTitle("");
      refresh();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {tasks.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={allSelected}
                disabled={busy}
                onCheckedChange={(value) => toggleAll(value === true)}
                aria-label="전체 선택"
              />
              <span>전체 선택</span>
            </label>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={busy || selectedCount === 0}
              onClick={() => void handleBulkDelete()}
            >
              <Trash2 className="size-3.5" aria-hidden />
              선택 삭제{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
          </div>
          <ul className="divide-y divide-border/80 rounded-lg border border-border/70 bg-muted/10">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
                <Checkbox
                  className="mt-2"
                  checked={selectedIds.has(task.id)}
                  disabled={busy}
                  onCheckedChange={(value) => toggleOne(task.id, value === true)}
                  aria-label={`${task.title} 선택`}
                />
                <span className="mt-2 w-7 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-primary">
                  {task.position}
                </span>
                <Input
                  className="min-w-0 flex-1 border-transparent bg-transparent px-2 py-1.5 font-medium text-foreground shadow-none focus-visible:border-input focus-visible:bg-background"
                  defaultValue={task.title}
                  disabled={busy}
                  aria-label={`업무 ${task.position}`}
                  onBlur={(ev) => void handleBlurUpdate(task.id, task.title, ev.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy}
                  aria-label="업무 삭제"
                  onClick={() => void handleDelete(task.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-md border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
          등록된 업무가 없습니다. 아래에서 추가하거나{" "}
          <span className="font-medium text-foreground/80">업무 목록 업로드</span>로 일괄 등록할 수 있습니다.
        </p>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="new-task-title" className="text-xs font-semibold uppercase tracking-wide text-primary">
            업무 추가
          </Label>
          <Input
            id="new-task-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="새 업무명을 입력 후 추가"
            disabled={busy}
            className="font-medium"
          />
        </div>
        <Button type="submit" disabled={busy || !newTitle.trim()} className="shrink-0 gap-1.5">
          <Plus className="size-4" aria-hidden />
          추가
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="status">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">행에서 포커스를 벗어나면 제목이 자동 저장됩니다.</p>
    </div>
  );
}
