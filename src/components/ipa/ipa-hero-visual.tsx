/** 랜딩 히어로용 IPA 사분면 비주얼 — 카드/오버레이 없이 full-bleed 앵커 */
export function IpaHeroVisual({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square w-full max-w-lg select-none ${className}`}
      aria-hidden
    >
      {/* 종이판 느낌의 면 — SVG만 두면 대비가 약해져 히어로 앵커가 약해짐 */}
      <div className="absolute inset-[6%] rounded-md border border-ink/10 bg-card/70 shadow-[0_1px_0_oklch(0.55_0.03_220/0.06)]" />
      <svg viewBox="0 0 320 320" className="relative h-full w-full overflow-visible" fill="none">
        {/* 사분면 면 — 채도·대비 강화 */}
        <rect x="48" y="48" width="112" height="112" fill="oklch(0.78 0.1 75 / 0.28)" />
        <rect x="160" y="48" width="112" height="112" fill="oklch(0.72 0.07 205 / 0.22)" />
        <rect x="48" y="160" width="112" height="112" fill="oklch(0.92 0.01 210 / 0.9)" />
        <rect x="160" y="160" width="112" height="112" fill="oklch(0.72 0.05 205 / 0.1)" />

        {/* 외곽 */}
        <rect x="48" y="48" width="224" height="224" stroke="oklch(0.35 0.04 230 / 0.35)" strokeWidth="1.25" />

        {/* 축 */}
        <line
          x1="48"
          y1="272"
          x2="272"
          y2="272"
          className="ipa-axis"
          stroke="oklch(0.32 0.04 230 / 0.75)"
          strokeWidth="1.75"
        />
        <line
          x1="48"
          y1="272"
          x2="48"
          y2="48"
          className="ipa-axis"
          stroke="oklch(0.32 0.04 230 / 0.75)"
          strokeWidth="1.75"
        />
        <line
          x1="160"
          y1="48"
          x2="160"
          y2="272"
          stroke="oklch(0.4 0.03 220 / 0.35)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line
          x1="48"
          y1="160"
          x2="272"
          y2="160"
          stroke="oklch(0.4 0.03 220 / 0.35)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* 축 라벨 */}
        <text
          x="160"
          y="296"
          textAnchor="middle"
          fill="oklch(0.45 0.03 230)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          수행도 →
        </text>
        <text
          x="22"
          y="160"
          textAnchor="middle"
          fill="oklch(0.45 0.03 230)"
          transform="rotate(-90 22 160)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          중요도 →
        </text>

        {/* 사분면 라벨 */}
        <text
          x="104"
          y="100"
          textAnchor="middle"
          fill="oklch(0.5 0.1 70)"
          style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-display), serif" }}
        >
          집중 개선
        </text>
        <text
          x="216"
          y="100"
          textAnchor="middle"
          fill="oklch(0.4 0.07 205)"
          style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-display), serif" }}
        >
          유지 강화
        </text>
        <text
          x="104"
          y="220"
          textAnchor="middle"
          fill="oklch(0.5 0.02 230)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          낮은 우선
        </text>
        <text
          x="216"
          y="220"
          textAnchor="middle"
          fill="oklch(0.5 0.02 230)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          과잉 가능
        </text>

        {/* 산점도 점 */}
        <circle cx="96" cy="82" r="5.5" className="ipa-dot ipa-dot-1" fill="oklch(0.58 0.12 70)" />
        <circle cx="122" cy="112" r="4.5" className="ipa-dot ipa-dot-2" fill="oklch(0.62 0.11 75 / 0.9)" />
        <circle cx="224" cy="90" r="5.5" className="ipa-dot ipa-dot-3" fill="oklch(0.45 0.08 205)" />
        <circle cx="244" cy="126" r="4.5" className="ipa-dot ipa-dot-4" fill="oklch(0.5 0.07 205 / 0.9)" />
        <circle cx="84" cy="214" r="4" className="ipa-dot ipa-dot-2" fill="oklch(0.4 0.03 230 / 0.45)" />
        <circle cx="208" cy="230" r="4" className="ipa-dot ipa-dot-3" fill="oklch(0.4 0.03 230 / 0.4)" />
      </svg>
    </div>
  );
}
