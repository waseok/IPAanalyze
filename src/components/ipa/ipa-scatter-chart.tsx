"use client";

import { useMemo, useState } from "react";
import { QUADRANT_GUIDES, QUADRANT_THEME, type QuadrantKey } from "@/lib/constants";
import { quadrantMeta, type IpaResult } from "@/lib/ipa";

/** 순수 SVG (Recharts 미사용). foreignObject는 hydration 이슈가 있어 툴팁은 SVG 밖에서 표시 */
const W = 800;
const H = 400;
const PAD_L = 52;
const PAD_R = 28;
const PAD_T = 28;
const PAD_B = 52;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

type Props = {
  data: IpaResult;
};

function toRows(points: IpaResult["points"]) {
  return points
    .filter((p) => p.responseCount > 0 && Number.isFinite(p.avgPerformance) && Number.isFinite(p.avgImportance))
    .map((p) => ({
      taskId: p.taskId,
      title: p.title,
      avgImportance: p.avgImportance,
      avgPerformance: p.avgPerformance,
      responseCount: p.responseCount,
      quadrant: p.quadrant,
    }));
}

function xScale(performance: number) {
  return PAD_L + ((performance - 1) / 4) * PLOT_W;
}

function yScale(importance: number) {
  return PAD_T + ((5 - importance) / 4) * PLOT_H;
}

export function IpaScatterChart({ data }: Props) {
  const points = useMemo(() => toRows(data.points), [data.points]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hovered = points.find((p) => p.taskId === hoverId);

  const vx = xScale(data.xCutoff);
  const hy = yScale(data.yCutoff);

  const ticks = [1, 2, 3, 4, 5];

  return (
    <div className="w-full space-y-2 overflow-x-auto">
      <svg
        width={W}
        height={H}
        className="max-w-full font-sans text-foreground"
        role="img"
        aria-label="중요도 수행도 산점도"
      >
        <rect x={0} y={0} width={W} height={H} fill="transparent" />

        {ticks.map((t) => (
          <g key={`g-${t}`}>
            <line
              x1={xScale(t)}
              y1={PAD_T}
              x2={xScale(t)}
              y2={PAD_T + PLOT_H}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
            />
            <line
              x1={PAD_L}
              y1={yScale(t)}
              x2={PAD_L + PLOT_W}
              y2={yScale(t)}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
            />
          </g>
        ))}

        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.25}
          rx={4}
        />

        <line x1={vx} y1={PAD_T} x2={vx} y2={PAD_T + PLOT_H} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" />
        <line x1={PAD_L} y1={hy} x2={PAD_L + PLOT_W} y2={hy} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" />

        {points.map((p) => {
          const cx = xScale(p.avgPerformance);
          const cy = yScale(p.avgImportance);
          const active = hoverId === p.taskId;
          const theme = QUADRANT_THEME[p.quadrant as QuadrantKey];
          return (
            <g key={p.taskId}>
              <circle
                cx={cx}
                cy={cy}
                r={active ? 9 : 6}
                fill={theme.fill}
                fillOpacity={active ? 0.95 : 0.78}
                stroke={theme.stroke}
                strokeWidth={active ? 2 : 1}
                className="cursor-pointer transition-[r] duration-150"
                onMouseEnter={() => setHoverId(p.taskId)}
                onMouseLeave={() => setHoverId(null)}
              >
                <title>{`${p.title} — 중요도 ${p.avgImportance.toFixed(2)}, 수행도 ${p.avgPerformance.toFixed(2)}, 응답 ${p.responseCount}`}</title>
              </circle>
            </g>
          );
        })}

        {ticks.map((t) => (
          <text
            key={`xl-${t}`}
            x={xScale(t)}
            y={H - 16}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {t}
          </text>
        ))}
        <text x={PAD_L + PLOT_W / 2} y={H - 2} textAnchor="middle" className="fill-foreground text-xs font-medium">
          수행도 (1–5)
        </text>

        {ticks.map((t) => (
          <text
            key={`yl-${t}`}
            x={PAD_L - 10}
            y={yScale(t) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px]"
          >
            {t}
          </text>
        ))}
        <text
          x={14}
          y={PAD_T + PLOT_H / 2}
          textAnchor="middle"
          className="fill-foreground text-xs font-medium"
          transform={`rotate(-90 14 ${PAD_T + PLOT_H / 2})`}
        >
          중요도 (1–5)
        </text>
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
          <span key={q} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: QUADRANT_THEME[q].fill }} />
            <span className="font-medium text-foreground">{q}</span>
            <span>{QUADRANT_GUIDES[q].name}</span>
          </span>
        ))}
      </div>

      {hovered ? (
        <div className="max-w-xl rounded-lg border border-border bg-card p-3 text-xs shadow-sm ring-1 ring-border/40">
          <p className="font-semibold leading-snug text-foreground">{hovered.title}</p>
          <p className="mt-1 text-muted-foreground">
            중요도 {hovered.avgImportance.toFixed(2)} · 수행도 {hovered.avgPerformance.toFixed(2)}
          </p>
          <p className="text-muted-foreground">집계 응답 수 {hovered.responseCount}</p>
          <p className="mt-1 font-medium text-foreground">
            {hovered.quadrant} {quadrantMeta(hovered.quadrant).name} · {quadrantMeta(hovered.quadrant).tagline}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">점에 마우스를 올리면 업무 요약이 표시됩니다.</p>
      )}
    </div>
  );
}
