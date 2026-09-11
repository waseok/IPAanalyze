import "server-only";

import { sanitizeTaskTitles } from "@/lib/import-tasks";
import { heuristicPdfTasks, tryParseExcelAllStrategies } from "@/lib/roster-heuristics";

async function extractPdfText(bytes: ArrayBuffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const textResult = await parser.getText();
    return textResult.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export type ParseDocumentResult = {
  titles: string[];
  usedLlm: false;
};

/** 운영 환경에서는 개인정보가 외부로 전송되지 않도록 규칙 기반으로만 처리한다. */
export async function parseDocumentToTaskTitles(bytes: ArrayBuffer, fileName: string): Promise<ParseDocumentResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const text = (await extractPdfText(bytes)).trim();
    if (!text) throw new Error("PDF에서 텍스트를 읽지 못했습니다. 텍스트 포함 PDF인지 확인해주세요.");
    const titles = heuristicPdfTasks(text);
    if (titles.length === 0) {
      throw new Error("업무 항목을 찾지 못했습니다. 제공된 Excel 양식으로 다시 업로드해주세요.");
    }
    return { titles: sanitizeTaskTitles(titles), usedLlm: false };
  }

  if (ext === "xlsx" || ext === "xls") {
    const titles = tryParseExcelAllStrategies(bytes);
    if (!titles?.length) {
      throw new Error("업무 항목을 찾지 못했습니다. '업무명' 열이 있는 Excel 양식을 이용해주세요.");
    }
    return { titles: sanitizeTaskTitles(titles), usedLlm: false };
  }

  throw new Error("지원 형식은 PDF 또는 Excel(.xlsx, .xls)입니다.");
}
