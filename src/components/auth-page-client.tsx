"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "@/components/auth-form";

/** 로그인 세션이 있으면 관리자 대시보드로 보냄(자동 로그인 효과) */
export function AuthPageClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<"check" | "form">("check");

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        // 유효하지 않은 리프레시 토큰 등 → 로컬/쿠키 정리 후 로그인 폼 표시 (콘솔 AuthApiError 완화)
        await supabase.auth.signOut().catch(() => undefined);
        setPhase("form");
        return;
      }
      if (user) router.replace("/admin");
      else setPhase("form");
    })();
  }, [router]);

  if (phase === "check") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        세션 확인 중…
      </p>
    );
  }
  return <AuthForm />;
}
