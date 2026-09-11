create schema if not exists private;

create table public.survey_campaigns (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'archived')),
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table public.campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.survey_campaigns(id) on delete cascade,
  source_task_id uuid references public.tasks(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (campaign_id, position),
  unique (id, campaign_id)
);

create table public.participant_tokens (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.survey_campaigns(id) on delete cascade,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  code_hint text not null check (char_length(code_hint) between 2 and 4),
  submitted_at timestamptz,
  last_saved_at timestamptz,
  revoked_at timestamptz,
  legacy_session_id uuid unique references public.survey_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, campaign_id)
);

create table public.campaign_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.survey_campaigns(id) on delete cascade,
  participant_token_id uuid not null,
  campaign_task_id uuid not null,
  importance_score integer not null check (importance_score between 1 and 5),
  performance_score integer not null check (performance_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (participant_token_id, campaign_id)
    references public.participant_tokens(id, campaign_id) on delete cascade,
  foreign key (campaign_task_id, campaign_id)
    references public.campaign_tasks(id, campaign_id) on delete cascade,
  unique (participant_token_id, campaign_task_id)
);

create index survey_campaigns_school_id_idx on public.survey_campaigns (school_id, created_at desc);
create index campaign_tasks_campaign_id_idx on public.campaign_tasks (campaign_id, position);
create index participant_tokens_campaign_id_idx on public.participant_tokens (campaign_id);
create index campaign_responses_campaign_id_idx on public.campaign_responses (campaign_id);

alter table public.survey_campaigns enable row level security;
alter table public.campaign_tasks enable row level security;
alter table public.participant_tokens enable row level security;
alter table public.campaign_responses enable row level security;

create policy "admins manage own campaigns"
on public.survey_campaigns for all to authenticated
using (exists (
  select 1 from public.schools s
  where s.id = survey_campaigns.school_id and s.admin_id = (select auth.uid())
))
with check (exists (
  select 1 from public.schools s
  where s.id = survey_campaigns.school_id and s.admin_id = (select auth.uid())
));

create policy "admins manage own campaign tasks"
on public.campaign_tasks for all to authenticated
using (exists (
  select 1 from public.survey_campaigns c
  join public.schools s on s.id = c.school_id
  where c.id = campaign_tasks.campaign_id and s.admin_id = (select auth.uid())
))
with check (exists (
  select 1 from public.survey_campaigns c
  join public.schools s on s.id = c.school_id
  where c.id = campaign_tasks.campaign_id and s.admin_id = (select auth.uid())
));

create policy "admins manage own participant tokens"
on public.participant_tokens for all to authenticated
using (exists (
  select 1 from public.survey_campaigns c
  join public.schools s on s.id = c.school_id
  where c.id = participant_tokens.campaign_id and s.admin_id = (select auth.uid())
))
with check (exists (
  select 1 from public.survey_campaigns c
  join public.schools s on s.id = c.school_id
  where c.id = participant_tokens.campaign_id and s.admin_id = (select auth.uid())
));

create policy "admins manage own campaign responses"
on public.campaign_responses for all to authenticated
using (exists (
  select 1 from public.survey_campaigns c
  join public.schools s on s.id = c.school_id
  where c.id = campaign_responses.campaign_id and s.admin_id = (select auth.uid())
))
with check (exists (
  select 1 from public.survey_campaigns c
  join public.schools s on s.id = c.school_id
  where c.id = campaign_responses.campaign_id and s.admin_id = (select auth.uid())
));

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.schools, public.tasks, public.survey_sessions,
  public.responses, public.survey_campaigns, public.campaign_tasks, public.participant_tokens,
  public.campaign_responses to authenticated, service_role;
revoke all on public.survey_campaigns, public.campaign_tasks, public.participant_tokens,
  public.campaign_responses from anon;

create or replace function public.open_survey_campaign(p_campaign_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_school_id uuid;
begin
  select c.school_id into v_school_id
  from public.survey_campaigns c
  where c.id = p_campaign_id and c.status = 'draft'
  for update;

  if v_school_id is null then
    raise exception '초안 상태의 설문 회차를 찾을 수 없습니다.';
  end if;

  if not exists (select 1 from public.tasks t where t.school_id = v_school_id) then
    raise exception '등록된 업무가 없습니다.';
  end if;

  insert into public.campaign_tasks (campaign_id, source_task_id, title, position)
  select p_campaign_id, t.id, t.title,
    row_number() over (order by t.position nulls last, t.created_at)::integer
  from public.tasks t
  where t.school_id = v_school_id
  order by t.position nulls last, t.created_at;

  update public.survey_campaigns
  set status = 'open', updated_at = now()
  where id = p_campaign_id;
end;
$$;

revoke all on function public.open_survey_campaign(uuid) from public, anon;
grant execute on function public.open_survey_campaign(uuid) to authenticated;

create or replace function public.replace_school_tasks(p_school_id uuid, p_titles jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.schools s
    where s.id = p_school_id and s.admin_id = (select auth.uid())
  ) then
    raise exception '권한이 없습니다.';
  end if;

  select jsonb_array_length(p_titles) into v_count;
  if v_count < 1 or v_count > 220 then
    raise exception '업무는 1개 이상 220개 이하로 등록해주세요.';
  end if;

  delete from public.tasks where school_id = p_school_id;
  insert into public.tasks (school_id, title, position)
  select p_school_id, trim(value), ordinality::integer
  from jsonb_array_elements_text(p_titles) with ordinality
  where char_length(trim(value)) between 1 and 200;

  if (select count(*) from public.tasks where school_id = p_school_id) <> v_count then
    raise exception '비어 있거나 너무 긴 업무명이 포함되어 있습니다.';
  end if;
  return v_count;
end;
$$;

revoke all on function public.replace_school_tasks(uuid, jsonb) from public, anon;
grant execute on function public.replace_school_tasks(uuid, jsonb) to authenticated;

create or replace function public.save_campaign_response(p_code_hash text, p_ratings jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token public.participant_tokens%rowtype;
  v_campaign public.survey_campaigns%rowtype;
  v_expected integer;
  v_received integer;
begin
  select * into v_token
  from public.participant_tokens
  where code_hash = p_code_hash and revoked_at is null
  for update;

  if v_token.id is null then
    raise exception '유효하지 않은 참여코드입니다.';
  end if;

  select * into v_campaign from public.survey_campaigns where id = v_token.campaign_id;
  if v_campaign.status <> 'open'
    or (v_campaign.opens_at is not null and now() < v_campaign.opens_at)
    or (v_campaign.closes_at is not null and now() >= v_campaign.closes_at) then
    raise exception '현재 응답할 수 없는 설문입니다.';
  end if;

  select count(*) into v_expected from public.campaign_tasks where campaign_id = v_campaign.id;
  select count(distinct item->>'taskId') into v_received from jsonb_array_elements(p_ratings) item;

  if v_expected = 0 or v_received <> v_expected or jsonb_array_length(p_ratings) <> v_expected then
    raise exception '모든 업무를 한 번씩 평가해주세요.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_ratings) item
    left join public.campaign_tasks ct
      on ct.id = (item->>'taskId')::uuid and ct.campaign_id = v_campaign.id
    where ct.id is null
      or (item->>'importance')::integer not between 1 and 5
      or (item->>'performance')::integer not between 1 and 5
  ) then
    raise exception '설문 응답 형식이 올바르지 않습니다.';
  end if;

  insert into public.campaign_responses (
    campaign_id, participant_token_id, campaign_task_id, importance_score, performance_score
  )
  select
    v_campaign.id,
    v_token.id,
    (item->>'taskId')::uuid,
    (item->>'importance')::integer,
    (item->>'performance')::integer
  from jsonb_array_elements(p_ratings) item
  on conflict (participant_token_id, campaign_task_id) do update
  set importance_score = excluded.importance_score,
      performance_score = excluded.performance_score,
      updated_at = now();

  update public.participant_tokens
  set submitted_at = coalesce(submitted_at, now()), last_saved_at = now()
  where id = v_token.id;

  return v_token.id;
end;
$$;

revoke all on function public.save_campaign_response(text, jsonb) from public, anon, authenticated;
grant execute on function public.save_campaign_response(text, jsonb) to service_role;

-- Preserve any data produced by the pre-campaign version in one closed campaign per school.
insert into public.survey_campaigns (school_id, title, status, opens_at, closes_at)
select s.id, '기존 설문', 'closed', min(ss.created_at), max(coalesce(ss.submitted_at, ss.created_at))
from public.schools s
left join public.survey_sessions ss on ss.school_id = s.id
group by s.id;

insert into public.campaign_tasks (campaign_id, source_task_id, title, position)
select c.id, t.id, t.title,
  row_number() over (partition by t.school_id order by t.position nulls last, t.created_at)::integer
from public.tasks t
join public.survey_campaigns c on c.school_id = t.school_id and c.title = '기존 설문';

insert into public.participant_tokens (
  campaign_id, code_hash, code_hint, submitted_at, last_saved_at, legacy_session_id, created_at
)
select c.id, encode(digest('legacy:' || ss.id::text, 'sha256'), 'hex'), '기존',
  ss.submitted_at, coalesce(ss.submitted_at, ss.created_at), ss.id, ss.created_at
from public.survey_sessions ss
join public.survey_campaigns c on c.school_id = ss.school_id and c.title = '기존 설문';

insert into public.campaign_responses (
  campaign_id, participant_token_id, campaign_task_id, importance_score, performance_score, created_at, updated_at
)
select c.id, pt.id, ct.id, r.importance_score, r.performance_score, r.created_at, r.created_at
from public.responses r
join public.survey_campaigns c on c.school_id = r.school_id and c.title = '기존 설문'
join public.participant_tokens pt on pt.legacy_session_id = r.survey_session_id
join public.campaign_tasks ct on ct.campaign_id = c.id and ct.source_task_id = r.task_id;
