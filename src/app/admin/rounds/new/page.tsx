import Link from "next/link";
import { redirect } from "next/navigation";
import { PageWrap } from "@/components/layout/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { NewRoundForm } from "./new-round-form";

export default async function NewRoundPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (!schools?.length) redirect("/admin");

  const selectedId =
    params.school && schools.some((s) => s.id === params.school) ? params.school : schools[0].id;
  const selectedSchool = schools.find((s) => s.id === selectedId)!;

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-6">
        <header className="space-y-3 border-b border-border/60 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit gap-1 border-primary/20 bg-primary/10 font-normal text-primary">
              <ClipboardList className="size-3" aria-hidden />
              설문 회차
            </Badge>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href={`/admin/rounds?school=${selectedSchool.id}`}>
                <ChevronLeft className="size-4" aria-hidden />
                회차 목록
              </Link>
            </Button>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">새 설문 회차</h1>
          {/* 학교명은 여기 한 줄만 — 칩과 큰 제목에 중복하지 않음 */}
          <p className="text-sm font-medium text-foreground/90">
            학교: <span className="text-primary">{selectedSchool.name}</span>
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            회차명과 설문 기간을 입력한 뒤 만들면 됩니다. 상단의 학교·설문 회차 메뉴로 언제든 이동할 수 있습니다.
          </p>
        </header>

        {schools.length > 1 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">다른 학교로 전환</p>
            <div className="flex flex-wrap gap-2">
              {schools
                .filter((school) => school.id !== selectedId)
                .map((school) => (
                  <Link
                    key={school.id}
                    href={`/admin/rounds/new?school=${school.id}`}
                    className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium transition hover:border-primary/25"
                  >
                    {school.name}
                  </Link>
                ))}
            </div>
          </div>
        ) : null}

        <NewRoundForm schoolId={selectedSchool.id} />
      </PageWrap>
    </main>
  );
}
