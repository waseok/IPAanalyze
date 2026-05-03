create extension if not exists "pgcrypto";

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[0-9]{6}$'),
  admin_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  position int,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_label text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  survey_session_id uuid not null references public.survey_sessions(id) on delete cascade,
  importance_score int not null check (importance_score between 1 and 5),
  performance_score int not null check (performance_score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (survey_session_id, task_id)
);

alter table public.schools enable row level security;
alter table public.tasks enable row level security;
alter table public.survey_sessions enable row level security;
alter table public.responses enable row level security;

create policy "admin can read schools"
on public.schools for select
using (auth.uid() = admin_id);

create policy "admin can create schools"
on public.schools for insert
with check (auth.uid() = admin_id);

create policy "admin can update schools"
on public.schools for update
using (auth.uid() = admin_id)
with check (auth.uid() = admin_id);

create policy "admin can manage tasks"
on public.tasks for all
using (
  exists (
    select 1 from public.schools s
    where s.id = tasks.school_id and s.admin_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.schools s
    where s.id = tasks.school_id and s.admin_id = auth.uid()
  )
);

create policy "admin can read survey sessions"
on public.survey_sessions for select
using (
  exists (
    select 1 from public.schools s
    where s.id = survey_sessions.school_id and s.admin_id = auth.uid()
  )
);

create policy "admin can read responses"
on public.responses for select
using (
  exists (
    select 1 from public.schools s
    where s.id = responses.school_id and s.admin_id = auth.uid()
  )
);
