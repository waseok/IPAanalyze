"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, ClipboardList } from "lucide-react";

const nav = [
  {
    href: "/admin",
    label: "학교",
    icon: Building2,
    match: (path: string) =>
      path === "/admin" || (/^\/admin\/[^/]+(\/|$)/.test(path) && !path.startsWith("/admin/rounds")),
  },
  {
    href: "/admin/rounds",
    label: "설문 회차",
    icon: ClipboardList,
    match: (path: string) => path.startsWith("/admin/rounds"),
  },
] as const;

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex items-center gap-0.5" aria-label="관리자 메뉴">
      {nav.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-navy/10 text-navy"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <item.icon className="size-3.5" aria-hidden />
            {item.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-2 -bottom-[0.65rem] hidden h-0.5 rounded-sm bg-navy sm:block"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
