"use client";

import { useState } from "react";
import { createSchool } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSchoolForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function formAction(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);
    const result = await createSchool(formData);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);
    setPending(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="space-y-1">
        <Label htmlFor="school-name">학교명</Label>
        <Input id="school-name" name="name" placeholder="예: 해솔초등학교" required />
      </div>
      <Button disabled={pending} type="submit">
        워크스페이스 생성
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
    </form>
  );
}
