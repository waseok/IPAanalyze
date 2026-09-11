"use client";

import { useState } from "react";
import { updateAdminPassword } from "@/app/actions";
import { PageWrap } from "@/components/layout/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  async function action(formData: FormData) {
    setError(null);
    const result = await updateAdminPassword(formData);
    if (result?.error) setError(result.error);
  }
  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="sm">
        <Card>
          <CardHeader><CardTitle>관리자 비밀번호 재설정</CardTitle></CardHeader>
          <CardContent>
            <form action={action} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="new-password">새 비밀번호 (12자 이상, 영문 대·소문자와 숫자 포함)</Label><Input id="new-password" name="password" type="password" minLength={12} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,}" autoComplete="new-password" required /></div>
              <Button type="submit" className="w-full">비밀번호 변경</Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>
          </CardContent>
        </Card>
      </PageWrap>
    </main>
  );
}
