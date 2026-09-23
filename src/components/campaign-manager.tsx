"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  changeSurveyCampaignStatus,
  createSurveyCampaign,
  deleteArchivedCampaign,
  generateParticipantCodes,
  openSurveyCampaign,
  revokeParticipantToken,
} from "@/app/campaign-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";

export type CampaignSummary = {
  id: string;
  title: string;
  status: "draft" | "open" | "closed" | "archived";
  opensAt: string | null;
  closesAt: string | null;
  taskCount: number;
  tokenCount: number;
  submittedCount: number;
  unusedTokens: Array<{ id: string; hint: string; createdAt: string }>;
};

const STATUS_LABEL = { draft: "초안", open: "진행", closed: "마감", archived: "보관" } as const;

function localInputDate(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function showDate(value: string | null) {
  return value ? new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "미설정";
}

/** 설문 회차 생성 폼. 시작/마감은 편의상 지금·7일 후 기본값(의도된 동작). */
export function CampaignCreateForm({
  schoolId,
  onCreated,
}: {
  schoolId: string;
  /** 생성 성공 후 호출(리다이렉트 등). 없으면 refresh만 수행. */
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function create(formData: FormData) {
    setBusy(true);
    setError(null);
    setMessage(null);
    for (const field of ["opensAt", "closesAt"]) {
      const value = String(formData.get(field) ?? "");
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) formData.set(field, date.toISOString());
    }
    const result = await createSurveyCampaign(formData);
    if (result.error) setError(result.error);
    else {
      setMessage(result.success ?? null);
      router.refresh();
      onCreated?.();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <form
        action={create}
        autoComplete="off"
        className="grid gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-4 md:grid-cols-2"
      >
        <input type="hidden" name="schoolId" value={schoolId} />
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="campaign-title">회차명</Label>
          <Input
            id="campaign-title"
            name="title"
            placeholder="예: 2026년 1학기 업무 IPA"
            required
            maxLength={80}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            만든 뒤 「설문 열기」→ 참여코드(숫자 6자리) Excel 발급만 하면 됩니다.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-opens">시작 시각</Label>
          <Input
            id="campaign-opens"
            name="opensAt"
            type="datetime-local"
            defaultValue={localInputDate(0)}
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-closes">마감 시각</Label>
          <Input
            id="campaign-closes"
            name="closesAt"
            type="datetime-local"
            defaultValue={localInputDate(7)}
            required
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-muted-foreground md:col-span-2">
          기본값: 지금 ~ 7일 후(변경 가능). 회차명·시각은 자동으로 확정되지 않으며, 제출해야 회차가 만들어집니다.
        </p>
        <Button type="submit" disabled={busy} className="md:col-span-2">
          {busy ? "생성 중…" : "새 설문 회차 만들기"}
        </Button>
      </form>
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function CampaignCard({
  schoolId,
  campaign,
  busyId,
  onChange,
  onIssue,
  onRevoke,
  onRemove,
}: {
  schoolId: string;
  campaign: CampaignSummary;
  busyId: string | null;
  onChange: (id: string, next: "open" | "closed" | "archived") => void;
  onIssue: (campaign: CampaignSummary, formData: FormData) => void;
  onRevoke: (campaignId: string, tokenId: string) => void;
  onRemove: (campaign: CampaignSummary) => void;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{campaign.title}</h3>
            <Badge variant={campaign.status === "open" ? "default" : "secondary"}>{STATUS_LABEL[campaign.status]}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {showDate(campaign.opensAt)} ~ {showDate(campaign.closesAt)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            문항 {campaign.taskCount}개 · 제출 {campaign.submittedCount}/{campaign.tokenCount}명
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/admin/${schoolId}/results?campaign=${campaign.id}`}>결과 보기</a>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {campaign.status === "draft" ? (
          <Button size="sm" disabled={busyId === campaign.id} onClick={() => onChange(campaign.id, "open")}>
            설문 열기
          </Button>
        ) : null}
        {campaign.status === "open" ? (
          <Button size="sm" variant="secondary" disabled={busyId === campaign.id} onClick={() => onChange(campaign.id, "closed")}>
            설문 마감
          </Button>
        ) : null}
        {campaign.status === "closed" ? (
          <Button size="sm" variant="outline" disabled={busyId === campaign.id} onClick={() => onChange(campaign.id, "archived")}>
            보관함으로
          </Button>
        ) : null}
        {campaign.status === "archived" ? (
          <Button size="sm" variant="destructive" disabled={busyId === campaign.id} onClick={() => onRemove(campaign)}>
            영구 삭제
          </Button>
        ) : null}
      </div>
      {campaign.status === "draft" || campaign.status === "open" ? (
        <form action={(formData) => onIssue(campaign, formData)} className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor={`code-count-${campaign.id}`}>참여코드 개수 (숫자 6자리)</Label>
            <Input id={`code-count-${campaign.id}`} name="count" type="number" min={1} max={200} defaultValue={30} className="w-36" required />
          </div>
          <Button type="submit" variant="outline" disabled={busyId === campaign.id}>
            Excel로 발급
          </Button>
        </form>
      ) : null}
      {campaign.unusedTokens.length > 0 ? (
        <details className="border-t border-border/60 pt-3 text-sm">
          <summary className="cursor-pointer font-medium">미사용 코드 {campaign.unusedTokens.length}개 관리</summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {campaign.unusedTokens.map((token) => (
              <li key={token.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="text-muted-foreground">
                  끝자리 <strong className="font-mono text-foreground">{token.hint}</strong>
                </span>
                <Button type="button" size="sm" variant="ghost" disabled={busyId === token.id} onClick={() => onRevoke(campaign.id, token.id)}>
                  폐기
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function CampaignManager({ schoolId, campaigns }: { schoolId: string; campaigns: CampaignSummary[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { active, archived } = useMemo(() => {
    const activeList: CampaignSummary[] = [];
    const archivedList: CampaignSummary[] = [];
    for (const c of campaigns) {
      if (c.status === "archived") archivedList.push(c);
      else activeList.push(c);
    }
    return { active: activeList, archived: archivedList };
  }, [campaigns]);

  async function change(id: string, next: "open" | "closed" | "archived") {
    setBusyId(id);
    setError(null);
    setMessage(null);
    const result = next === "open" ? await openSurveyCampaign(id) : await changeSurveyCampaignStatus(id, next);
    if (result.error) setError(result.error);
    else {
      setMessage(result.success ?? null);
      router.refresh();
    }
    setBusyId(null);
  }

  async function issue(campaign: CampaignSummary, formData: FormData) {
    setBusyId(campaign.id);
    setError(null);
    setMessage(null);
    const result = await generateParticipantCodes(campaign.id, Number(formData.get("count")));
    if ("error" in result) setError(result.error ?? "참여코드 발급에 실패했습니다.");
    else if (result.codes) {
      const rows = result.codes.map((row) => ({
        번호: row.number,
        참여코드: row.code,
        참여링크: `${window.location.origin}${row.path}`,
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      sheet["!cols"] = [{ wch: 8 }, { wch: 12 }, { wch: 55 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "참여코드");
      XLSX.writeFile(workbook, `${result.campaignTitle}_참여코드.xlsx`);
      setMessage(`${rows.length}개 숫자 참여코드를 발급하고 Excel로 내려받았습니다. 원본 코드는 다시 조회할 수 없습니다.`);
      router.refresh();
    }
    setBusyId(null);
  }

  async function revoke(campaignId: string, tokenId: string) {
    setBusyId(tokenId);
    setError(null);
    setMessage(null);
    const result = await revokeParticipantToken(campaignId, tokenId);
    if (result.error) setError(result.error);
    else {
      setMessage(result.success ?? null);
      router.refresh();
    }
    setBusyId(null);
  }

  async function remove(campaign: CampaignSummary) {
    if (!window.confirm(`“${campaign.title}” 회차와 모든 익명 응답을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    setBusyId(campaign.id);
    setError(null);
    setMessage(null);
    const result = await deleteArchivedCampaign(campaign.id);
    if (result.error) setError(result.error);
    else {
      setMessage(result.success ?? null);
      router.refresh();
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">진행·초안·마감 ({active.length})</h3>
        {active.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">활성 설문 회차가 없습니다.</p>
        ) : (
          active.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              schoolId={schoolId}
              campaign={campaign}
              busyId={busyId}
              onChange={(id, next) => void change(id, next)}
              onIssue={(c, fd) => void issue(c, fd)}
              onRevoke={(cid, tid) => void revoke(cid, tid)}
              onRemove={(c) => void remove(c)}
            />
          ))
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/10">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-muted/40"
          onClick={() => setArchiveOpen((v) => !v)}
          aria-expanded={archiveOpen}
        >
          <span className="inline-flex items-center gap-2">
            {archiveOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            보관함 ({archived.length})
          </span>
          <span className="text-xs font-normal text-muted-foreground">접어 보관 · 영구 삭제는 여기서</span>
        </button>
        {archiveOpen ? (
          <div className="space-y-3 border-t border-border/60 px-3 py-3 sm:px-4">
            {archived.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">보관한 회차가 없습니다.</p>
            ) : (
              archived.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  schoolId={schoolId}
                  campaign={campaign}
                  busyId={busyId}
                  onChange={(id, next) => void change(id, next)}
                  onIssue={(c, fd) => void issue(c, fd)}
                  onRevoke={(cid, tid) => void revoke(cid, tid)}
                  onRemove={(c) => void remove(c)}
                />
              ))
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
