import "server-only";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import * as XLSX from "xlsx";
import { sanitizeTaskTitles } from "@/lib/import-tasks";
import { heuristicPdfTasks, matrixSnippetForLlm, tryParseExcelAllStrategies } from "@/lib/roster-heuristics";

const MAX_LLM_INPUT_CHARS = 14_000;
const MAX_TASKS_RETURN = 220;

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

function parseJsonArrayFromModelText(text: string): string[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("JSON 배열을 찾지 못했습니다.");
  const raw = text.slice(start, end + 1);
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error("응답이 배열이 아닙니다.");
  const strings = parsed.filter((x): x is string => typeof x === "string").map((s) => s.trim());
  return strings.filter((s) => s.length >= 2).slice(0, MAX_TASKS_RETURN);
}

async function refineTasksWithLlm(sourceLabel: "excel" | "pdf", raw: string): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error("자동 인식에 실패했습니다. OPENAI_API_KEY를 설정하면 AI로 목록 정리를 시도합니다.");
  }
  const modelId = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const snippet = raw.slice(0, MAX_LLM_INPUT_CHARS);

  const { text } = await generateText({
    model: openai(modelId),
    prompt: [
      "당신은 학교 행정 '업무 배정표'에서 IPA 설문용 업무 목록만 추출하는 도우미입니다.",
      "",
      "규칙:",
      "- 출력은 JSON 배열만 (설명·코드펜스 없이). 예: [\"업무1\",\"업무2\"]",
      "- 각 원소는 한 가지 업무를 대표하는 짧은 한국어 문구 (중복 제거)",
      "- 학생 이름, 전화, 주민번호 등 개인정보로 보이는 토큰은 목록에 넣지 마세요.",
      "- 최대 200개까지. 의미 없는 표 머리글·페이지 번호만 있는 줄은 제외.",
      "",
      `입력 형식 힌트: ${sourceLabel === "excel" ? "엑셀 시트를 탭으로 붙인 텍스트" : "PDF에서 추출한 텍스트"}`,
      "",
      "---",
      snippet,
    ].join("\n"),
  });

  const arr = parseJsonArrayFromModelText(text);
  return sanitizeTaskTitles(arr);
}

export type ParseDocumentResult = {
  titles: string[];
  usedLlm: boolean;
};

/** PDF 또는 엑셀(xlsx/xls). 규칙 기반 우선, 실패 시 LLM(키가 있을 때만). */
export async function parseDocumentToTaskTitles(bytes: ArrayBuffer, fileName: string): Promise<ParseDocumentResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const pdfText = await extractPdfText(bytes);
    const trimmed = pdfText.trim();
    if (!trimmed) throw new Error("PDF에서 텍스트를 읽지 못했습니다. 텍스트 포함 PDF인지 확인해주세요.");

    const titles = heuristicPdfTasks(trimmed);
    if (titles.length > 0) return { titles, usedLlm: false };

    const llmTitles = await refineTasksWithLlm("pdf", trimmed);
    return { titles: llmTitles, usedLlm: true };
  }

  if (ext === "xlsx" || ext === "xls") {
    const fromRules = tryParseExcelAllStrategies(bytes);
    if (fromRules && fromRules.length > 0) return { titles: fromRules, usedLlm: false };

    const workbook = XLSX.read(bytes, { type: "array" });
    const snippet = matrixSnippetForLlm(workbook);
    const llmTitles = await refineTasksWithLlm("excel", snippet);
    return { titles: llmTitles, usedLlm: true };
  }

  throw new Error("지원 형식은 PDF 또는 Excel(.xlsx, .xls)입니다.");
}
