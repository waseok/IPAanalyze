import { describe, expect, it } from "vitest";
import { buildIpaResult, classifyQuadrant } from "./ipa";

describe("classifyQuadrant", () => {
  it("각 점수를 올바른 사분면으로 분류한다", () => {
    expect(classifyQuadrant(4, 4, 3, 3)).toBe("Q1");
    expect(classifyQuadrant(4, 2, 3, 3)).toBe("Q2");
    expect(classifyQuadrant(2, 2, 3, 3)).toBe("Q3");
    expect(classifyQuadrant(2, 4, 3, 3)).toBe("Q4");
  });
});

describe("buildIpaResult", () => {
  it("평균 기준선과 사분면 목록을 계산한다", () => {
    const result = buildIpaResult([
      { taskId: "1", title: "A", avgImportance: 5, avgPerformance: 5, responseCount: 2 },
      { taskId: "2", title: "B", avgImportance: 5, avgPerformance: 1, responseCount: 2 },
      { taskId: "3", title: "C", avgImportance: 1, avgPerformance: 1, responseCount: 2 },
      { taskId: "4", title: "D", avgImportance: 1, avgPerformance: 5, responseCount: 2 },
    ]);

    expect(result.points).toHaveLength(4);
    expect(result.quadrants.Q1).toHaveLength(1);
    expect(result.quadrants.Q2).toHaveLength(1);
    expect(result.quadrants.Q3).toHaveLength(1);
    expect(result.quadrants.Q4).toHaveLength(1);
  });
});
