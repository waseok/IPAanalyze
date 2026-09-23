import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 전역 배경: 차가운 분석 용지 + 은은한 격자 (보라/크림 톤 배제) */
export function SiteBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_70%_at_12%_-8%,oklch(0.7_0.08_250/0.2),transparent_55%),radial-gradient(ellipse_70%_50%_at_92%_8%,oklch(0.75_0.07_235/0.16),transparent_50%),linear-gradient(165deg,oklch(0.978_0.012_245)_0%,oklch(0.96_0.018_248)_48%,oklch(0.952_0.02_242)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.45] [background-image:linear-gradient(oklch(0.5_0.05_255/0.08)_1px,transparent_1px),linear-gradient(90deg,oklch(0.5_0.05_255/0.08)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035] mix-blend-multiply [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]"
      />
    </>
  );
}

const maxW = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
} as const;

export function PageWrap({
  children,
  className,
  max = "lg",
}: {
  children: ReactNode;
  className?: string;
  max?: keyof typeof maxW;
}) {
  return (
    <div className={cn("relative mx-auto w-full flex-1 px-4 py-8 md:px-6 md:py-10", maxW[max], className)}>
      {children}
    </div>
  );
}

/** 관리·설문 페이지 공통 섹션 헤더 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</div> : null}
      </div>
      {actions}
    </header>
  );
}
