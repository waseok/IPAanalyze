import { DEFAULT_CUTOFF, QUADRANT_GUIDES, type QuadrantKey } from "@/lib/constants";

export type TaskAggregate = {
  taskId: string;
  title: string;
  avgImportance: number;
  avgPerformance: number;
  responseCount: number;
};

export type QuadrantItem = TaskAggregate & {
  quadrant: QuadrantKey;
};

export type IpaResult = {
  xCutoff: number;
  yCutoff: number;
  points: QuadrantItem[];
  quadrants: Record<QuadrantKey, QuadrantItem[]>;
};

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function classifyQuadrant(
  avgImportance: number,
  avgPerformance: number,
  xCutoff: number,
  yCutoff: number,
): QuadrantKey {
  if (avgImportance >= yCutoff && avgPerformance >= xCutoff) return "Q1";
  if (avgImportance >= yCutoff && avgPerformance < xCutoff) return "Q2";
  if (avgImportance < yCutoff && avgPerformance < xCutoff) return "Q3";
  return "Q4";
}

export function buildIpaResult(
  tasks: TaskAggregate[],
  mode: "average" | "fixed" = "average",
  fixedCutoff = DEFAULT_CUTOFF,
): IpaResult {
  const ratedTasks = tasks.filter((task) => task.responseCount > 0);
  const xCutoff =
    mode === "average" && ratedTasks.length > 0
      ? round2(ratedTasks.reduce((sum, task) => sum + task.avgPerformance, 0) / ratedTasks.length)
      : fixedCutoff;
  const yCutoff =
    mode === "average" && ratedTasks.length > 0
      ? round2(ratedTasks.reduce((sum, task) => sum + task.avgImportance, 0) / ratedTasks.length)
      : fixedCutoff;

  const points = ratedTasks.map((task) => ({
    ...task,
    quadrant: classifyQuadrant(task.avgImportance, task.avgPerformance, xCutoff, yCutoff),
  }));

  const quadrants: IpaResult["quadrants"] = {
    Q1: [],
    Q2: [],
    Q3: [],
    Q4: [],
  };

  for (const point of points) {
    quadrants[point.quadrant].push(point);
  }

  return { xCutoff, yCutoff, points, quadrants };
}

export function quadrantMeta(quadrant: QuadrantKey) {
  return QUADRANT_GUIDES[quadrant];
}
