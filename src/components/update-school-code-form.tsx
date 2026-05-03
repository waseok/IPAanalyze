"use client";

import { useState } from "react";
import { updateSchoolCode } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UpdateSchoolCodeFormProps = {
  schoolId: string;
  currentCode: string;
};

export function UpdateSchoolCodeForm({ schoolId, currentCode }: UpdateSchoolCodeFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function formAction(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const result = await updateSchoolCode(formData);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(result.success);

    setPending(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 md:flex-row md:items-end">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="space-y-1">
        <Label htmlFor="school-code">학교 코드 (숫자 6자리)</Label>
        <Input
          id="school-code"
          name="code"
          defaultValue={currentCode}
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          required
        />
      </div>
      <Button disabled={pending} type="submit" variant="secondary">
        코드 수정
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
    </form>
  );
}
