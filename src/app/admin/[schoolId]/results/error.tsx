"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function IpaResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[IPA 결과]", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6 md:p-8">
      <h1 className="text-xl font-bold">IPA 결과를 불러오지 못했습니다</h1>
      <p className="text-sm text-muted-foreground">{error.message || "알 수 없는 오류"}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          다시 시도
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">관리자 목록</Link>
        </Button>
      </div>
    </main>
  );
}
