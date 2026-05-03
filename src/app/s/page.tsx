import { redirect } from "next/navigation";

export default async function SurveyEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = String(params.code ?? "").trim();
  if (code) {
    redirect(`/s/${code}`);
  }
  redirect("/");
}
