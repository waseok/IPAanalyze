import Papa from "papaparse";
import * as XLSX from "xlsx";
import { z } from "zod";

const rowSchema = z.string().trim().min(1);

const CANDIDATE_HEADERS = ["업무명", "Task Name", "task", "업무", "세부업무", "담당업무", "세부 업무", "담당 업무"];

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function selectColumn(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return null;
  const first = rows[0];
  const keys = Object.keys(first);
  const preferred = keys.find((key) => CANDIDATE_HEADERS.map((v) => v.toLowerCase()).includes(normalizeHeader(key)));
  return preferred ?? keys[0] ?? null;
}

export function sanitizeTaskTitles(values: unknown[]) {
  const dedup = new Set<string>();
  const titles: string[] = [];

  for (const value of values) {
    const parsed = rowSchema.safeParse(String(value ?? ""));
    if (!parsed.success) continue;
    const title = parsed.data;
    if (!dedup.has(title)) {
      dedup.add(title);
      titles.push(title);
    }
  }

  if (titles.length === 0) {
    throw new Error("업무명을 찾지 못했습니다. '업무명' 또는 'Task Name' 컬럼을 확인해주세요.");
  }

  return titles;
}

/** 한 줄에 하나의 업무명 — 직접 입력/붙여넣기용 */
export function parseTaskTitlesFromText(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return sanitizeTaskTitles(lines);
}

/** 양식 다운로드: 1행은 헤더(업무명), 이후는 예시 */
export const TASK_UPLOAD_TEMPLATE_ROWS: readonly (readonly [string])[] = [
  ["업무명"],
  ["학부모 상담 응대"],
  ["행정 서류 작성"],
  ["업무 회의 준비"],
];

function escapeCsvCell(cell: string) {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

/** Excel에서 한글 깨짐 방지용 UTF-8 BOM 포함 */
export function buildTaskUploadTemplateCsv() {
  const body = TASK_UPLOAD_TEMPLATE_ROWS.map((row) => escapeCsvCell(row[0])).join("\r\n");
  return `\ufeff${body}\r\n`;
}

export async function parseTasksFromFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const bytes = await file.arrayBuffer();

  if (ext === "csv") {
    const text = new TextDecoder().decode(bytes);
    const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
    const rows = parsed.data;
    const column = selectColumn(rows);
    if (!column) throw new Error("CSV 파일에서 컬럼을 찾을 수 없습니다.");
    return sanitizeTaskTitles(rows.map((row) => row[column]));
  }

  const workbook = XLSX.read(bytes, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error("엑셀 시트를 찾을 수 없습니다.");
  }

  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const column = selectColumn(rows);
  if (!column) throw new Error("엑셀 파일에서 컬럼을 찾을 수 없습니다.");
  return sanitizeTaskTitles(rows.map((row) => row[column]));
}
