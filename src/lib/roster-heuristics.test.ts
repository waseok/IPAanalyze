import { describe, expect, it } from "vitest";
import { findRosterHeaderRow, splitDetailCell } from "./roster-heuristics";

describe("splitDetailCell", () => {
  it("□ 기준으로 분리한다", () => {
    const s = "□ 첫 업무 □ 둘째 업무";
    expect(splitDetailCell(s)).toEqual(["첫 업무", "둘째 업무"]);
  });

  it("단일 문장은 그대로 반환한다", () => {
    expect(splitDetailCell("□ 단일 항목")).toEqual(["단일 항목"]);
  });
});

describe("findRosterHeaderRow", () => {
  it("세부업무/담당업무 헤더 행을 찾는다", () => {
    const matrix: unknown[][] = [
      ["2026 업무 배정", "", ""],
      ["부서", "순", "담당업무", "담당자명", "세부업무", "소속 학년"],
      ["교무부", 1, "역할", "", "□ 세부1 □ 세부2", ""],
    ];
    const h = findRosterHeaderRow(matrix);
    expect(h).not.toBeNull();
    expect(h?.row).toBe(1);
    expect(h?.detailCol).toBe(4);
    expect(h?.roleCol).toBe(2);
  });
});
