"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, ClipboardList } from "lucide-react";

const nav = [
  { href: "/admin", label: "학교", icon: Building2, match: (path: string) => path === "/admin" || /^\/admin\/[^/]+(\/|$)/.test(path) && !path.startsWith("/admin/rounds") },
  { href: "/admin/rounds", label: "설문 회차", icon: ClipboardList, match: (path: string) => path.startsWith("/admin/rounds") },
] as const;

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex items-center gap-1" aria-label="관리자 메뉴">
      {nav.map((item) => {
        const active = item.match(pathname);
        return (
          <Button
            key={item.href}
            asChild
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn("gap-1.5 font-medium", active && "ring-1 ring-primary/25")}
          >
            <Link href={item.href} aria-current={active ? "page" : undefined}>
              <item.icon className="size-3.5" aria-hidden />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
