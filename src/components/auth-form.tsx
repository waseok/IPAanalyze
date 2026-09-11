"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { requestPasswordReset, signInAdmin, signUpAdmin } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LS_EMAIL = "ipa_admin_signin_email";
const LS_REMEMBER = "ipa_admin_remember_email";

export function AuthForm() {
  const rememberId = useId();
  const [signInPending, setSignInPending] = useState(false);
  const [signUpPending, setSignUpPending] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signInEmail, setSignInEmail] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const remember = localStorage.getItem(LS_REMEMBER) === "1";
        setRememberEmail(remember);
        if (remember) setSignInEmail(localStorage.getItem(LS_EMAIL) ?? "");
      } catch { /* private mode 등 */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function onSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      if (rememberEmail) {
        const email = String(formData.get("email") ?? "").trim();
        localStorage.setItem(LS_REMEMBER, "1");
        if (email) localStorage.setItem(LS_EMAIL, email);
      } else {
        localStorage.setItem(LS_REMEMBER, "0");
        localStorage.removeItem(LS_EMAIL);
      }
    } catch {
      /* ignore */
    }
    setSignInPending(true);
    setSignInError(null);
    const result = await signInAdmin(formData);
    if (result?.error) setSignInError(result.error);
    setSignInPending(false);
  }

  async function onSignUp(formData: FormData) {
    setSignUpPending(true);
    setSignUpError(null);
    const result = await signUpAdmin(formData);
    if (result?.error) setSignUpError(result.error);
    setSignUpPending(false);
  }

  async function onReset(formData: FormData) {
    setResetMessage(null);
    const result = await requestPasswordReset(formData);
    setResetMessage(result.success ?? null);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSignIn} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="sign-in-email">이메일</Label>
              <Input
                id="sign-in-email"
                name="email"
                type="email"
                value={signInEmail}
                onChange={(ev) => setSignInEmail(ev.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sign-in-password">비밀번호</Label>
              <Input id="sign-in-password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                id={rememberId}
                type="checkbox"
                checked={rememberEmail}
                onChange={(ev) => setRememberEmail(ev.target.checked)}
                className="mt-1 size-4 rounded border-input accent-primary"
              />
              <Label htmlFor={rememberId} className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground">
                이메일 저장 · 다음 방문 시 입력란에 불러옵니다.
                <span className="mt-0.5 block text-xs text-muted-foreground/90">
                  세션이 유지되면 /auth 접속 시 자동으로 대시보드로 이동합니다.
                </span>
              </Label>
            </div>
            {signInError ? <p className="text-sm text-red-600">{signInError}</p> : null}
            <Button disabled={signInPending} type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>관리자 가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onSignUp} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="sign-up-email">이메일</Label>
              <Input id="sign-up-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sign-up-password">비밀번호 (12자 이상, 영문 대·소문자와 숫자 포함)</Label>
              <Input id="sign-up-password" name="password" type="password" minLength={12} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,}" required autoComplete="new-password" />
            </div>
            {signUpError ? <p className="text-sm text-red-600">{signUpError}</p> : null}
            <Button disabled={signUpPending} type="submit" variant="secondary" className="w-full">
              가입
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>비밀번호 재설정</CardTitle></CardHeader>
        <CardContent>
          <form action={onReset} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1"><Label htmlFor="reset-email">승인된 관리자 이메일</Label><Input id="reset-email" name="email" type="email" required /></div>
            <Button type="submit" variant="outline">재설정 메일 보내기</Button>
          </form>
          {resetMessage ? <p className="mt-2 text-sm text-muted-foreground">{resetMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
