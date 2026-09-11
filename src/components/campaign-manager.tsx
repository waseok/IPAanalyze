"use client";

import { useState } from "react";
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

export function CampaignManager({ schoolId, campaigns }: { schoolId: string; campaigns: CampaignSummary[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function create(formData: FormData) {
    setBusyId("create"); setError(null); setMessage(null);
    for (const field of ["opensAt", "closesAt"]) {
      const value = String(formData.get(field) ?? "");
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) formData.set(field, date.toISOString());
    }
    const result = await createSurveyCampaign(formData);
    if (result.error) setError(result.error);
    else { setMessage(result.success ?? null); router.refresh(); }
    setBusyId(null);
  }

  async function change(id: string, next: "open" | "closed" | "archived") {
    setBusyId(id); setError(null); setMessage(null);
    const result = next === "open" ? await openSurveyCampaign(id) : await changeSurveyCampaignStatus(id, next);
    if (result.error) setError(result.error);
    else { setMessage(result.success ?? null); router.refresh(); }
    setBusyId(null);
  }

  async function issue(campaign: CampaignSummary, formData: FormData) {
    setBusyId(campaign.id); setError(null); setMessage(null);
    const result = await generateParticipantCodes(campaign.id, Number(formData.get("count")));
    if ("error" in result) setError(result.error ?? "참여코드 발급에 실패했습니다.");
    else if (result.codes) {
      const rows = result.codes.map((row) => ({ 번호: row.number, 참여코드: row.code, 참여링크: `${window.location.origin}${row.path}` }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      sheet["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 55 }];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "참여코드");
      XLSX.writeFile(workbook, `${result.campaignTitle}_참여코드.xlsx`);
      setMessage(`${rows.length}개 코드를 발급하고 Excel로 내려받았습니다. 원본 코드는 다시 조회할 수 없습니다.`);
      router.refresh();
    }
    setBusyId(null);
  }

  async function revoke(campaignId: string, tokenId: string) {
    setBusyId(tokenId); setError(null); setMessage(null);
    const result = await revokeParticipantToken(campaignId, tokenId);
    if (result.error) setError(result.error);
    else { setMessage(result.success ?? null); router.refresh(); }
    setBusyId(null);
  }

  async function remove(campaign: CampaignSummary) {
    if (!window.confirm(`“${campaign.title}” 회차와 모든 익명 응답을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    setBusyId(campaign.id); setError(null); setMessage(null);
    const result = await deleteArchivedCampaign(campaign.id);
    if (result.error) setError(result.error);
    else { setMessage(result.success ?? null); router.refresh(); }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <form action={create} className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
        <input type="hidden" name="schoolId" value={schoolId} />
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="campaign-title">회차명</Label>
          <Input id="campaign-title" name="title" placeholder="예: 2026년 11월 업무 IPA" required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-opens">시작 시각</Label>
          <Input id="campaign-opens" name="opensAt" type="datetime-local" defaultValue={localInputDate(0)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-closes">마감 시각</Label>
          <Input id="campaign-closes" name="closesAt" type="datetime-local" defaultValue={localInputDate(7)} required />
        </div>
        <Button type="submit" disabled={busyId === "create"} className="md:col-span-2">
          {busyId === "create" ? "생성 중…" : "새 설문 회차 만들기"}
        </Button>
      </form>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">아직 설문 회차가 없습니다.</p>
        ) : campaigns.map((campaign) => (
          <section key={campaign.id} className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{campaign.title}</h3>
                  <Badge variant={campaign.status === "open" ? "default" : "secondary"}>{STATUS_LABEL[campaign.status]}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{showDate(campaign.opensAt)} ~ {showDate(campaign.closesAt)}</p>
                <p className="mt-1 text-sm text-muted-foreground">문항 {campaign.taskCount}개 · 제출 {campaign.submittedCount}/{campaign.tokenCount}명</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={`/admin/${schoolId}/results?campaign=${campaign.id}`}>결과 보기</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {campaign.status === "draft" ? <Button size="sm" disabled={busyId === campaign.id} onClick={() => void change(campaign.id, "open")}>설문 열기</Button> : null}
              {campaign.status === "open" ? <Button size="sm" variant="secondary" disabled={busyId === campaign.id} onClick={() => void change(campaign.id, "closed")}>설문 마감</Button> : null}
              {campaign.status === "closed" ? <Button size="sm" variant="outline" disabled={busyId === campaign.id} onClick={() => void change(campaign.id, "archived")}>보관</Button> : null}
              {campaign.status === "archived" ? <Button size="sm" variant="destructive" disabled={busyId === campaign.id} onClick={() => void remove(campaign)}>영구 삭제</Button> : null}
            </div>
            {campaign.status === "draft" || campaign.status === "open" ? (
              <form action={(formData) => issue(campaign, formData)} className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor={`code-count-${campaign.id}`}>추가 참여코드 수</Label>
                  <Input id={`code-count-${campaign.id}`} name="count" type="number" min={1} max={200} defaultValue={100} className="w-36" required />
                </div>
                <Button type="submit" variant="outline" disabled={busyId === campaign.id}>Excel로 발급</Button>
              </form>
            ) : null}
            {campaign.unusedTokens.length > 0 ? (
              <details className="border-t border-border/60 pt-3 text-sm">
                <summary className="cursor-pointer font-medium">미사용 코드 {campaign.unusedTokens.length}개 관리</summary>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {campaign.unusedTokens.map((token) => (
                    <li key={token.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span className="text-muted-foreground">끝자리 <strong className="font-mono text-foreground">{token.hint}</strong></span>
                      <Button type="button" size="sm" variant="ghost" disabled={busyId === token.id} onClick={() => void revoke(campaign.id, token.id)}>폐기</Button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        ))}
      </div>
      {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">{message}</p> : null}
    </div>
  );
}
