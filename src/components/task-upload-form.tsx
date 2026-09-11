"use client";

import { useState } from "react";
import { parseAndUploadRosterDocument } from "@/app/actions";
import { TASK_UPLOAD_TEMPLATE_ROWS } from "@/lib/import-tasks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, FileSpreadsheet, FileText, Table2 } from "lucide-react";

type Props = {
  schoolId: string;
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const blockTitleClass = "text-sm font-bold text-primary";

export function TaskUploadForm({ schoolId }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFileSubmit(formData: FormData) {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      setError("파일을 선택해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await parseAndUploadRosterDocument(schoolId, formData);
      if ("error" in result) setError(result.error ?? "문서 처리에 실패했습니다.");
      else setMessage(result.success ?? "업무 목록을 저장했습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "문서 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadXlsxTemplate() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const data = TASK_UPLOAD_TEMPLATE_ROWS.map((r) => [...r]);
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws, "업무");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    const bytes = new Uint8Array(out);
    triggerDownload(
      new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "업무목록_양식.xlsx",
    );
  }

  return (
    <div className="space-y-5">
      <Alert className="border-chart-2/30 bg-chart-2/[0.08] dark:border-chart-2/25 dark:bg-chart-2/[0.12]">
        <BarChart3 className="size-4 text-chart-2" aria-hidden />
        <AlertTitle className="text-base font-bold text-foreground">업무분장 · IPA용 목록</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <strong className="font-semibold text-primary">PDF 또는 Excel</strong>만 업로드합니다. 개인정보가 외부 서비스로 전송되지 않도록 규칙 기반으로만 표 구조를 읽습니다. 저장 시 기존 업무는{" "}
          <span className="font-semibold text-destructive/90">전체 교체</span>됩니다. 개별 수정은 학교 대시보드의{" "}
          <span className="font-semibold text-foreground/90">업무 목록</span>에서 하세요.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono text-[11px] font-semibold">
          pdf · xlsx · xls
        </Badge>
        <Badge variant="secondary" className="text-[11px] font-semibold">
          개인정보 외부 전송 없음
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-primary/25 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className={blockTitleClass}>간단 양식 (Excel)</p>
            <p className="text-sm text-muted-foreground">
              한 열 <code className="rounded bg-muted px-1 font-mono text-xs text-foreground">업무명</code>만 있으면 규칙만으로 바로 인식됩니다.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 font-semibold" onClick={() => void downloadXlsxTemplate()}>
            <Table2 className="size-3.5 text-primary" aria-hidden />
            엑셀 양식 다운로드 하기
          </Button>
        </div>

        <form action={onFileSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-file" className={`${blockTitleClass} text-foreground`}>
              업무 분장 문서
            </Label>
            <Input
              id="task-file"
              name="file"
              type="file"
              accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              required
              className="cursor-pointer border-border/80 bg-background/60 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold"
            />
          </div>
          <Button type="submit" disabled={busy} className="gap-2 font-semibold">
            <FileSpreadsheet className="size-4 opacity-90" aria-hidden />
            {busy ? "분석·저장 중…" : "문서에서 추출해 저장"}
          </Button>
        </form>
      </div>

      {error ? (
        <p className="text-sm font-medium text-destructive" role="status">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400" role="status">
          {message}
        </p>
      ) : null}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="size-3.5 shrink-0 text-primary/80" aria-hidden />
        <span>
          개별 항목 편집은 <strong className="text-foreground/90">학교 대시보드 → 업무 목록</strong>에서 하세요.
        </span>
      </p>
    </div>
  );
}
