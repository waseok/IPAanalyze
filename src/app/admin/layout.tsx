import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
              <BarChart3 className="size-[1.15rem]" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">업무 IPA 콘솔</p>
              <p className="hidden text-xs text-muted-foreground sm:block">업무 수집 · 설문 · IPA 집계</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}
