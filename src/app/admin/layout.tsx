import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-paper/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-6">
            <Link href="/admin" className="group flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-teal/25 bg-teal/10 font-heading text-sm font-semibold text-teal transition group-hover:border-teal/40"
              >
                IPA
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold leading-tight text-foreground">
                  학교 업무 IPA
                </p>
                <p className="hidden text-xs text-muted-foreground sm:block">관리 콘솔</p>
              </div>
            </Link>
            <AdminNav />
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}
