import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Building2, ClipboardList } from "lucide-react";

const nav = [
  { href: "/admin", label: "학교", icon: Building2 },
  { href: "/admin/rounds", label: "설문 회차", icon: ClipboardList },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-5">
            <Link href="/admin" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                <BarChart3 className="size-[1.15rem]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">업무 IPA 콘솔</p>
                <p className="hidden text-xs text-muted-foreground sm:block">업무 · 회차 · IPA</p>
              </div>
            </Link>
            <nav className="flex items-center gap-1" aria-label="관리자 메뉴">
              {nav.map((item) => (
                <Button key={item.href} asChild variant="ghost" size="sm" className="gap-1.5 font-medium">
                  <Link href={item.href}>
                    <item.icon className="size-3.5" aria-hidden />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
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
