"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import type { IpaResult } from "@/lib/ipa";
import type { AnonymousResponse } from "@/lib/campaign-results";
import { Download, Printer } from "lucide-react";

type Props = {
  schoolName: string;
  campaignTitle: string;
  opensAt: string | null;
  closesAt: string | null;
  participantCount: number;
  tokenTotal: number;
  ipa: IpaResult;
  responses: AnonymousResponse[];
};

function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80);
}

export function ResultExports(props: Props) {
  function downloadExcel() {
    const workbook = XLSX.utils.book_new();
    const summary = XLSX.utils.aoa_to_sheet([
      ["학교", props.schoolName],
      ["설문 회차", props.campaignTitle],
      ["시작", props.opensAt ? new Date(props.opensAt) : ""],
      ["마감", props.closesAt ? new Date(props.closesAt) : ""],
      ["발급 참여코드", props.tokenTotal],
      ["제출 인원", props.participantCount],
      ["수행도 기준선", props.ipa.xCutoff],
      ["중요도 기준선", props.ipa.yCutoff],
    ]);
    summary["!cols"] = [{ wch: 18 }, { wch: 34 }];

    const taskRows = props.ipa.points.map((point) => ({
      업무명: point.title,
      중요도평균: point.avgImportance,
      수행도평균: point.avgPerformance,
      응답수: point.responseCount,
      분면: point.quadrant,
    }));
    const tasks = XLSX.utils.json_to_sheet(taskRows);
    tasks["!cols"] = [{ wch: 42 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];

    const taskTitles = props.ipa.points.map((point) => point.title);
    const matrixRows = props.responses.map((response) => {
      const byTitle = new Map(response.ratings.map((rating) => [rating.title, rating]));
      const row: Record<string, string | number | Date> = {
        응답자번호: response.respondentNumber,
        제출시각: new Date(response.submittedAt),
      };
      for (const title of taskTitles) {
        row[`${title} 중요도`] = byTitle.get(title)?.importance ?? "";
        row[`${title} 수행도`] = byTitle.get(title)?.performance ?? "";
      }
      return row;
    });
    const matrix = XLSX.utils.json_to_sheet(matrixRows);
    matrix["!cols"] = [{ wch: 12 }, { wch: 22 }, ...taskTitles.flatMap(() => [{ wch: 18 }, { wch: 18 }])];

    XLSX.utils.book_append_sheet(workbook, summary, "회차 요약");
    XLSX.utils.book_append_sheet(workbook, tasks, "업무별 IPA");
    XLSX.utils.book_append_sheet(workbook, matrix, "익명 응답 행렬");
    XLSX.writeFile(workbook, `${safeName(props.schoolName)}_${safeName(props.campaignTitle)}_IPA.xlsx`);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="gap-2" onClick={downloadExcel}><Download className="size-4" /> Excel 내려받기</Button>
      <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="size-4" /> 인쇄·PDF 저장</Button>
    </div>
  );
}
