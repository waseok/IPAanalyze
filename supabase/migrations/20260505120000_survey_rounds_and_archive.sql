-- 설문 회차 보조 테이블(이전 실험용). 메인 플로우는 survey_campaigns 사용.
create table if not exists public.survey_rounds (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  code text not null unique check (code ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

create index if not exists survey_rounds_school_id_idx on public.survey_rounds (school_id);

alter table public.survey_rounds enable row level security;

drop policy if exists "admin can manage survey rounds" on public.survey_rounds;
create policy "admin can manage survey rounds"
on public.survey_rounds for all
using (
  exists (
    select 1 from public.schools s
    where s.id = survey_rounds.school_id and s.admin_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.schools s
    where s.id = survey_rounds.school_id and s.admin_id = auth.uid()
  )
);

alter table public.survey_sessions
  add column if not exists round_id uuid references public.survey_rounds(id) on delete set null;

alter table public.survey_sessions
  add column if not exists archived_at timestamptz;
