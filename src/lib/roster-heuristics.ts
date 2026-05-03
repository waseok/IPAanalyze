import * as XLSX from "xlsx";
import { sanitizeTaskTitles } from "@/lib/import-tasks";

/** `세부업무` 칸의 `□`·줄바꿈 등으로 쪼개 IPA용 항목 후보 생성 */
export function splitDetailCell(text: string): string[] {
  const normalized = text.replace(/\r/g, "").replace(/\u00a0/g, " ").trim();
  if (!normalized) return [];

  const byBullet = normalized
    .split(/□/g)
    .map((s) => s.replace(/^[·\s□]+/u, "").trim())
    .filter((s) => s.length >= 2);
  if (byBullet.length > 1) return byBullet;

  const byNl = normalized
    .split(/\n+/)
    .map((s) => s.replace(/^[□·\s]+/u, "").trim())
    .filter((s) => s.length >= 2);
  if (byNl.length > 1) return byNl;

  const single = normalized.replace(/^[□\s]+/u, "").trim();
  return single.length >= 2 ? [single] : [];
}

function compactHeaderCell(cell: unknown) {
  return String(cell ?? "")
    .trim()
    .replace(/\s+/g, "");
}

/** 표 헤더 행에서 세부업무/담당업무 열 인덱스 탐색 (업무 배정표 등) */
export function findRosterHeaderRow(matrix: unknown[][], maxScanRows = 45): { row: number; detailCol?: number; roleCol?: number } | null {
  const limit = Math.min(matrix.length, maxScanRows);
  for (let r = 0; r < limit; r += 1) {
    const row = matrix[r] ?? [];
    let detailCol: number | undefined;
    let roleCol: number | undefined;
    for (let c = 0; c < row.length; c += 1) {
      const h = compactHeaderCell(row[c]);
      if (h.includes("세부업무")) detailCol = c;
      else if ((h === "담당업무" || (h.includes("담당") && h.includes("업무"))) && !h.includes("세부")) roleCol = c;
    }
    if (detailCol != null || roleCol != null) return { row: r, detailCol, roleCol };
  }
  return null;
}

export function extractTitlesFromRosterMatrix(
  matrix: unknown[][],
  header: { row: number; detailCol?: number; roleCol?: number },
  maxDataRows = 1600,
) {
  const raw: string[] = [];
  const end = Math.min(matrix.length, header.row + 1 + maxDataRows);
  for (let r = header.row + 1; r < end; r += 1) {
    const line = matrix[r] ?? [];
    const detail = header.detailCol != null ? String(line[header.detailCol] ?? "").trim() : "";
    const role = header.roleCol != null ? String(line[header.roleCol] ?? "").trim() : "";
    const parts = detail
      ? splitDetailCell(detail)
      : role
        ? [role.replace(/^[□\s]+/u, "").trim()].filter((s) => s.length >= 2)
        : [];
    for (const p of parts) {
      if (p.length >= 2) raw.push(p);
    }
  }
  return raw;
}

function selectColumnFromRecords(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return null;
  const keys = Object.keys(rows[0]);
  const lowered = ["업무명", "task name", "task", "업무", "세부업무", "담당업무", "세부 업무", "담당 업무"];
  const preferred = keys.find((key) => lowered.includes(String(key ?? "").trim().toLowerCase()));
  return preferred ?? keys[0] ?? null;
}

function tryParseSimpleJsonSheet(sheet: XLSX.WorkSheet): string[] | null {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (rows.length === 0) return null;
  const keys = Object.keys(rows[0]);
  const looksLikeHeader = keys.some((k) =>
    ["업무명", "task name", "세부업무", "담당업무", "업무"].includes(String(k).trim().toLowerCase()),
  );
  if (!looksLikeHeader) return null;
  const col = selectColumnFromRecords(rows);
  if (!col) return null;
  try {
    return sanitizeTaskTitles(rows.map((row) => row[col]));
  } catch {
    return null;
  }
}

export function tryParseRosterSheet(sheet: XLSX.WorkSheet): string[] | null {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false }) as unknown[][];
  const header = findRosterHeaderRow(matrix);
  if (!header) return null;
  const raw = extractTitlesFromRosterMatrix(matrix, header);
  if (raw.length === 0) return null;
  try {
    return sanitizeTaskTitles(raw);
  } catch {
    return null;
  }
}

export function tryParseExcelAllStrategies(bytes: ArrayBuffer): string[] | null {
  const workbook = XLSX.read(bytes, { type: "array" });
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const roster = tryParseRosterSheet(sheet);
    if (roster && roster.length > 0) return roster;
  }
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const simple = tryParseSimpleJsonSheet(sheet);
    if (simple && simple.length > 0) return simple;
  }
  return null;
}

export function matrixSnippetForLlm(workbook: XLSX.WorkBook, maxRowsPerSheet = 35, maxSheets = 4): string {
  const parts: string[] = [];
  let sheetCount = 0;
  for (const name of workbook.SheetNames) {
    if (sheetCount >= maxSheets) break;
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false }) as unknown[][];
    const slice = matrix.slice(0, maxRowsPerSheet).map((row) => row.map((c) => String(c ?? "").trim()).join("\t"));
    parts.push(`[시트: ${name}]\n${slice.join("\n")}`);
    sheetCount += 1;
  }
  return parts.join("\n\n");
}

export function heuristicPdfTasks(text: string): string[] {
  const t = text.replace(/\r/g, "\n");
  const byBullet = t
    .split(/□/g)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 4 && s.length < 400);
  if (byBullet.length >= 3) {
    try {
      return sanitizeTaskTitles(byBullet);
    } catch {
      /* fall through */
    }
  }
  const lines = t
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 4 && l.length < 240 && !/^\d{1,4}$/.test(l) && !/^페이지\s*\d+/i.test(l));
  try {
    return sanitizeTaskTitles(lines);
  } catch {
    return [];
  }
}
