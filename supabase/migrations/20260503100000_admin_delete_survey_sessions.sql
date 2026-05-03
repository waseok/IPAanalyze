-- 학교 관리자가 제출된 설문 세션(및 cascade된 responses)을 삭제할 수 있도록

create policy "admin can delete survey sessions"
on public.survey_sessions for delete
using (
  exists (
    select 1 from public.schools s
    where s.id = survey_sessions.school_id and s.admin_id = auth.uid()
  )
);
