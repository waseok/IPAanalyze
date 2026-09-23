/** 랜딩 히어로용 IPA 사분면 비주얼 — 블루 패밀리 (navy/sky), 카드 오버레이 없음 */
export function IpaHeroVisual({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square w-full max-w-lg select-none ${className}`}
      aria-hidden
    >
      <div className="absolute inset-[6%] rounded-md border border-ink/10 bg-card/80 shadow-[0_1px_0_oklch(0.45_0.05_255/0.08)]" />
      <svg viewBox="0 0 320 320" className="relative h-full w-full overflow-visible" fill="none">
        {/* 사분면: 집중=짙은 navy wash · 유지=sky · 낮은/과잉=중립 blue-gray */}
        <rect x="48" y="48" width="112" height="112" fill="oklch(0.55 0.09 255 / 0.22)" />
        <rect x="160" y="48" width="112" height="112" fill="oklch(0.7 0.08 235 / 0.28)" />
        <rect x="48" y="160" width="112" height="112" fill="oklch(0.93 0.015 245 / 0.95)" />
        <rect x="160" y="160" width="112" height="112" fill="oklch(0.78 0.04 240 / 0.18)" />

        <rect x="48" y="48" width="224" height="224" stroke="oklch(0.35 0.06 255 / 0.4)" strokeWidth="1.25" />

        <line
          x1="48"
          y1="272"
          x2="272"
          y2="272"
          className="ipa-axis"
          stroke="oklch(0.3 0.06 255 / 0.8)"
          strokeWidth="1.75"
        />
        <line
          x1="48"
          y1="272"
          x2="48"
          y2="48"
          className="ipa-axis"
          stroke="oklch(0.3 0.06 255 / 0.8)"
          strokeWidth="1.75"
        />
        <line
          x1="160"
          y1="48"
          x2="160"
          y2="272"
          stroke="oklch(0.42 0.05 250 / 0.4)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line
          x1="48"
          y1="160"
          x2="272"
          y2="160"
          stroke="oklch(0.42 0.05 250 / 0.4)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        <text
          x="160"
          y="296"
          textAnchor="middle"
          fill="oklch(0.42 0.04 255)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          수행도 →
        </text>
        <text
          x="22"
          y="160"
          textAnchor="middle"
          fill="oklch(0.42 0.04 255)"
          transform="rotate(-90 22 160)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          중요도 →
        </text>

        <text
          x="104"
          y="100"
          textAnchor="middle"
          fill="oklch(0.36 0.09 255)"
          style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-display), serif" }}
        >
          집중 개선
        </text>
        <text
          x="216"
          y="100"
          textAnchor="middle"
          fill="oklch(0.42 0.08 235)"
          style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-display), serif" }}
        >
          유지 강화
        </text>
        <text
          x="104"
          y="220"
          textAnchor="middle"
          fill="oklch(0.48 0.03 250)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          낮은 우선
        </text>
        <text
          x="216"
          y="220"
          textAnchor="middle"
          fill="oklch(0.48 0.03 250)"
          style={{ fontSize: "11px", fontFamily: "var(--font-body), sans-serif" }}
        >
          과잉 가능
        </text>

        {/* 점: 중요도 축 쪽=navy · 수행도 축 쪽=sky */}
        <circle cx="96" cy="82" r="5.5" className="ipa-dot ipa-dot-1" fill="oklch(0.38 0.1 255)" />
        <circle cx="122" cy="112" r="4.5" className="ipa-dot ipa-dot-2" fill="oklch(0.42 0.09 255 / 0.9)" />
        <circle cx="224" cy="90" r="5.5" className="ipa-dot ipa-dot-3" fill="oklch(0.55 0.1 235)" />
        <circle cx="244" cy="126" r="4.5" className="ipa-dot ipa-dot-4" fill="oklch(0.6 0.09 235 / 0.9)" />
        <circle cx="84" cy="214" r="4" className="ipa-dot ipa-dot-2" fill="oklch(0.45 0.04 250 / 0.5)" />
        <circle cx="208" cy="230" r="4" className="ipa-dot ipa-dot-3" fill="oklch(0.5 0.05 240 / 0.45)" />
      </svg>
    </div>
  );
}
