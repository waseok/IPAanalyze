/** 랜딩 히어로용 IPA 사분면 비주얼 — 카드/오버레이 없이 full-bleed 앵커 */
export function IpaHeroVisual({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square w-full max-w-lg select-none ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 320 320" className="h-full w-full overflow-visible" fill="none">
        {/* 사분면 면 */}
        <rect x="40" y="40" width="120" height="120" className="fill-ochre/15" />
        <rect x="160" y="40" width="120" height="120" className="fill-teal/12" />
        <rect x="40" y="160" width="120" height="120" className="fill-muted/80" />
        <rect x="160" y="160" width="120" height="120" className="fill-teal/[0.06]" />

        {/* 축 */}
        <line x1="40" y1="280" x2="280" y2="280" className="ipa-axis stroke-ink/45" strokeWidth="1.5" />
        <line x1="40" y1="280" x2="40" y2="40" className="ipa-axis stroke-ink/45" strokeWidth="1.5" />
        <line x1="160" y1="40" x2="160" y2="280" className="stroke-ink/20" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="40" y1="160" x2="280" y2="160" className="stroke-ink/20" strokeWidth="1" strokeDasharray="3 4" />

        {/* 축 라벨 */}
        <text x="160" y="304" textAnchor="middle" className="fill-muted-foreground text-[11px]">
          수행도 →
        </text>
        <text
          x="18"
          y="160"
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
          transform="rotate(-90 18 160)"
        >
          중요도 →
        </text>

        {/* 사분면 라벨 */}
        <text x="100" y="100" textAnchor="middle" className="fill-ochre text-[10px] font-medium">
          집중 개선
        </text>
        <text x="220" y="100" textAnchor="middle" className="fill-teal text-[10px] font-medium">
          유지 강화
        </text>
        <text x="100" y="220" textAnchor="middle" className="fill-muted-foreground text-[10px]">
          낮은 우선
        </text>
        <text x="220" y="220" textAnchor="middle" className="fill-muted-foreground text-[10px]">
          과잉 가능
        </text>

        {/* 산점도 점 */}
        <circle cx="92" cy="78" r="5" className="ipa-dot ipa-dot-1 fill-ochre" />
        <circle cx="118" cy="108" r="4" className="ipa-dot ipa-dot-2 fill-ochre/80" />
        <circle cx="228" cy="88" r="5" className="ipa-dot ipa-dot-3 fill-teal" />
        <circle cx="248" cy="124" r="4" className="ipa-dot ipa-dot-4 fill-teal/80" />
        <circle cx="78" cy="210" r="3.5" className="ipa-dot ipa-dot-2 fill-ink/35" />
        <circle cx="210" cy="232" r="3.5" className="ipa-dot ipa-dot-3 fill-ink/30" />
      </svg>
    </div>
  );
}
