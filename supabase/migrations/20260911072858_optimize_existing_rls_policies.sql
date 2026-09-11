-- Cache auth.uid() once per query in the existing IPA policies.
-- App and Comment belong to a separate legacy application and are intentionally untouched.

alter policy "admin can read schools" on public.schools
  using ((select auth.uid()) = admin_id);

alter policy "admin can create schools" on public.schools
  with check ((select auth.uid()) = admin_id);

alter policy "admin can update schools" on public.schools
  using ((select auth.uid()) = admin_id)
  with check ((select auth.uid()) = admin_id);

alter policy "admin can manage tasks" on public.tasks
  using (exists (
    select 1 from public.schools s
    where s.id = tasks.school_id and s.admin_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.schools s
    where s.id = tasks.school_id and s.admin_id = (select auth.uid())
  ));

alter policy "admin can read survey sessions" on public.survey_sessions
  using (exists (
    select 1 from public.schools s
    where s.id = survey_sessions.school_id and s.admin_id = (select auth.uid())
  ));

alter policy "admin can delete survey sessions" on public.survey_sessions
  using (exists (
    select 1 from public.schools s
    where s.id = survey_sessions.school_id and s.admin_id = (select auth.uid())
  ));

alter policy "admin can read responses" on public.responses
  using (exists (
    select 1 from public.schools s
    where s.id = responses.school_id and s.admin_id = (select auth.uid())
  ));

alter policy "admin can delete responses for own school" on public.responses
  using (exists (
    select 1 from public.schools s
    where s.id = responses.school_id and s.admin_id = (select auth.uid())
  ));
