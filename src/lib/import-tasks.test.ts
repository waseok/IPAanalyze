import { describe, expect, it } from "vitest";
import { buildTaskUploadTemplateCsv, parseTaskTitlesFromText, sanitizeTaskTitles } from "./import-tasks";

describe("sanitizeTaskTitles", () => {
  it("빈 값 제거 및 중복 제거를 수행한다", () => {
    const result = sanitizeTaskTitles(["업무1", "업무2", "업무1", "", "   ", "업무3"]);
    expect(result).toEqual(["업무1", "업무2", "업무3"]);
  });

  it("유효한 업무명이 없으면 에러를 던진다", () => {
    expect(() => sanitizeTaskTitles(["", "   "])).toThrow();
  });
});

describe("parseTaskTitlesFromText", () => {
  it("줄 단위로 파싱하고 중복을 제거한다", () => {
    const text = "업무1\n업무2\n\n업무1\r\n  업무3  ";
    expect(parseTaskTitlesFromText(text)).toEqual(["업무1", "업무2", "업무3"]);
  });
});

describe("buildTaskUploadTemplateCsv", () => {
  it("BOM과 헤더를 포함한다", () => {
    const csv = buildTaskUploadTemplateCsv();
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("업무명");
    expect(csv).toContain("학부모");
  });
});
