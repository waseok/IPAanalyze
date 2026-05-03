-- 업무 삭제 시 responses CASCADE 및 명시적 DELETE가 RLS를 통과하도록
-- (기존에는 SELECT만 있어 CASCADE/삭제가 막힐 수 있음)

create policy "admin can delete responses for own school"
on public.responses for delete
using (
  exists (
    select 1 from public.schools s
    where s.id = responses.school_id and s.admin_id = auth.uid()
  )
);
