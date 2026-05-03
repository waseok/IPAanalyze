import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 전역 배경: 업무·데이터 분석 톤(은은한 그리드 + 그라데이션) */
export function SiteBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-sky-100/90 via-background to-violet-100/50 dark:from-slate-950 dark:via-background dark:to-indigo-950/35"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,oklch(0.9_0_0/0.35)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.9_0_0/0.35)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 dark:opacity-[0.12]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[min(42vh,420px)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.55_0.15_250/0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.45_0.12_250/0.18),transparent)]"
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
