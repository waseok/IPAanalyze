drop policy if exists "admin can update survey sessions" on public.survey_sessions;
create policy "admin can update survey sessions"
on public.survey_sessions for update
using (
  exists (
    select 1 from public.schools s
    where s.id = survey_sessions.school_id and s.admin_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.schools s
    where s.id = survey_sessions.school_id and s.admin_id = auth.uid()
  )
);
