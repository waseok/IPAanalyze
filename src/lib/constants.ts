export const LIKERT_MIN = 1;
export const LIKERT_MAX = 5;
export const DEFAULT_CUTOFF = 3;

export const QUADRANT_GUIDES = {
  Q1: {
    name: "유지 및 강화",
    /** 한 줄 요약 */
    tagline: "잘하고 있는 핵심 업무",
    description:
      "현재 잘 운영되고 있는 핵심 업무입니다. 지속적으로 현재의 지원 수준을 유지하고 모범 사례로 공유하세요.",
  },
  Q2: {
    name: "집중 개선",
    tagline: "중요한데 수행이 부족",
    description:
      "중요도에 비해 수행·지원이 부족합니다. 인적·물적 자원을 최우선으로 투입하고 업무 프로세스 개선이 시급합니다.",
  },
  Q3: {
    name: "우선순위 낮음",
    tagline: "통합·폐지 검토",
    description:
      "[통합 및 폐지 권고] 중요도와 수행도 모두 낮습니다. 불필요한 관행일 가능성이 높으므로 과감한 업무 폐지나 다른 업무와의 통폐합을 적극 검토하세요.",
  },
  Q4: {
    name: "과잉 노력",
    tagline: "효율화·위임",
    description:
      "중요도에 비해 과도한 노력이 들어가고 있습니다. 시스템화·자동화 또는 권한 위임으로 투입 에너지를 줄이세요.",
  },
} as const;

export type QuadrantKey = keyof typeof QUADRANT_GUIDES;

/** 분면 카드·산점도 점 색상 (Tailwind ring / SVG 겸용) */
export const QUADRANT_THEME: Record<
  QuadrantKey,
  { fill: string; stroke: string; cardBg: string; cardBorder: string; badge: string }
> = {
  Q1: {
    fill: "#16a34a",
    stroke: "#15803d",
    cardBg: "bg-emerald-500/[0.07]",
    cardBorder: "border-emerald-500/35",
    badge: "border-emerald-600/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
  },
  Q2: {
    fill: "#ca8a04",
    stroke: "#a16207",
    cardBg: "bg-amber-500/[0.08]",
    cardBorder: "border-amber-500/40",
    badge: "border-amber-600/40 bg-amber-500/15 text-amber-950 dark:text-amber-100",
  },
  Q3: {
    fill: "#64748b",
    stroke: "#475569",
    cardBg: "bg-slate-500/[0.08]",
    cardBorder: "border-slate-400/35",
    badge: "border-slate-500/40 bg-slate-500/15 text-slate-900 dark:text-slate-100",
  },
  Q4: {
    fill: "#2563eb",
    stroke: "#1d4ed8",
    cardBg: "bg-blue-500/[0.07]",
    cardBorder: "border-blue-500/35",
    badge: "border-blue-600/40 bg-blue-500/15 text-blue-950 dark:text-blue-100",
  },
};
