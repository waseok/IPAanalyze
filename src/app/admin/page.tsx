import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAdmin } from "@/app/actions";
import { PageWrap } from "@/components/layout/site-chrome";
import { CreateSchoolForm } from "@/components/create-school-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, ChevronRight } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: schools } = await supabase.from("schools").select("id, name, code, created_at").eq("admin_id", user.id).order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col">
      <PageWrap max="lg" className="flex flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit gap-1 border-primary/20 bg-primary/10 font-normal text-primary">
              <BarChart3 className="size-3" aria-hidden />
              관리자 대시보드
            </Badge>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">학교 워크스페이스</h1>
            <p className="max-w-xl text-sm text-muted-foreground">학교별 업무·설문·IPA 결과를 관리합니다.</p>
          </div>
          <form action={signOutAdmin}>
            <Button variant="outline" type="submit">
              로그아웃
            </Button>
          </form>
        </header>

        <Card className="border-border/80 shadow-sm ring-1 ring-border/30">
          <CardHeader>
            <CardTitle className="font-heading">학교 워크스페이스 생성</CardTitle>
            <CardDescription>새 학교를 추가하면 고유 코드와 설문 링크가 발급됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateSchoolForm />
          </CardContent>
        </Card>

        <Card className="border-primary/15 shadow-md ring-1 ring-primary/10">
          <CardHeader>
            <CardTitle className="font-heading">내 학교 목록</CardTitle>
            <CardDescription>선택하면 해당 학교의 업무 목록·업로드·IPA 결과로 이동합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {schools?.length ? (
              schools.map((school) => (
                <Link
                  key={school.id}
                  href={`/admin/${school.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/80 p-4 transition hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{school.name}</p>
                    <p className="text-sm text-muted-foreground">
                      학교 코드{" "}
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-foreground">{school.code}</span>
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">생성된 학교가 없습니다. 위에서 워크스페이스를 추가해 보세요.</p>
            )}
          </CardContent>
        </Card>
      </PageWrap>
    </main>
  );
}
