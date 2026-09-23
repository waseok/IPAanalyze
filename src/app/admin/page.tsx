import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAdmin } from "@/app/actions";
import { PageHeader, PageWrap } from "@/components/layout/site-chrome";
import { CreateSchoolForm } from "@/components/create-school-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, code, created_at")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-8">
        <PageHeader
          title="학교 워크스페이스"
          description="학교별 업무·설문·IPA 결과를 관리합니다."
          actions={
            <form action={signOutAdmin}>
              <Button variant="outline" type="submit">
                로그아웃
              </Button>
            </form>
          }
        />

        {/* 생성 폼: 상호작용이 있어 카드 유지 */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">워크스페이스 만들기</h2>
          <Card className="border-0 shadow-none ring-1 ring-border/60">
            <CardHeader className="pb-2">
              <CardDescription>새 학교를 추가하면 고유 코드와 설문 링크가 발급됩니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateSchoolForm />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">내 학교 목록</h2>
            <p className="mt-1 text-sm text-muted-foreground">선택하면 업무 목록·업로드·IPA 결과로 이동합니다.</p>
          </div>
          <div className="space-y-2">
            {schools?.length ? (
              schools.map((school) => (
                <Link
                  key={school.id}
                  href={`/admin/${school.id}`}
                  className="group flex items-center justify-between gap-3 rounded-md border border-border/80 bg-card/70 px-4 py-3.5 transition hover:border-teal/35 hover:bg-teal/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{school.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      학교 코드{" "}
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] font-medium text-foreground">
                        {school.code}
                      </span>
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-teal"
                    aria-hidden
                  />
                </Link>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                생성된 학교가 없습니다. 위에서 워크스페이스를 추가해 보세요.
              </p>
            )}
          </div>
        </section>
      </PageWrap>
    </main>
  );
}
