"use client";

import { useRouter } from "next/navigation";
import { CampaignCreateForm } from "@/components/campaign-manager";

/** 생성 성공 후 회차 목록으로 돌아가게 하는 클라이언트 래퍼 */
export function NewRoundForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  return (
    <CampaignCreateForm
      schoolId={schoolId}
      onCreated={() => {
        router.push(`/admin/rounds?school=${schoolId}`);
        router.refresh();
      }}
    />
  );
}
