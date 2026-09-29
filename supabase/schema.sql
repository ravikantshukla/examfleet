-- ExamFleet database schema (Supabase / Postgres).
-- Run this once in Supabase: Dashboard → SQL Editor → paste → Run.
-- Safe to re-run: every statement is idempotent.

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  target_exam text,
  lang text not null default 'en' check (lang in ('en', 'hi')),
  premium_until timestamptz,
  institute_id uuid,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'Aspirant')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ attempts: every answered question (powers accuracy & weak topics) ============
create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  subject text not null,
  topic text not null,
  correct boolean not null,
  mode text not null check (mode in ('daily', 'speed', 'practice', 'mock')),
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);

-- ============ daily_results: one row per user per day (leaderboard + streak) ============
create table if not exists public.daily_results (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  score int not null check (score between 0 and 10),
  total int not null default 10,
  time_ms int not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);
create index if not exists daily_results_board_idx on public.daily_results (date, score desc, time_ms asc);

-- ============ mock_results ============
create table if not exists public.mock_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  mock_slug text not null,
  score numeric(7, 2) not null,
  max_score numeric(7, 2) not null,
  correct int not null,
  wrong int not null,
  skipped int not null,
  time_ms int not null default 0,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mock_results_user_idx on public.mock_results (user_id, created_at desc);
create index if not exists mock_results_board_idx on public.mock_results (mock_slug, score desc, time_ms asc);

-- ============ ai_usage: AI doubt-helper calls per user per day ============
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  count int not null default 0,
  primary key (user_id, date)
);

-- ============ payments (written only by the server) ============
create table if not exists public.payments (
  payment_id text primary key,
  order_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null,
  amount_paise int not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- ============ institutes (coaching centres) ============
create table if not exists public.institutes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  active_until timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.institute_members (
  institute_id uuid not null references public.institutes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'teacher')),
  joined_at timestamptz not null default now(),
  primary key (institute_id, user_id)
);

do $$ begin
  alter table public.profiles add constraint profiles_institute_fk
    foreign key (institute_id) references public.institutes (id) on delete set null;
exception when duplicate_object then null; end $$;

-- ============ Row Level Security ============
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.daily_results enable row level security;
alter table public.mock_results enable row level security;
alter table public.ai_usage enable row level security;
alter table public.payments enable row level security;
alter table public.institutes enable row level security;
alter table public.institute_members enable row level security;

-- helper: is the current user a member (any role) or owner of an institute?
create or replace function public.is_institute_staff(inst uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from institutes where id = inst and owner_id = auth.uid())
      or exists (select 1 from institute_members where institute_id = inst and user_id = auth.uid() and role = 'teacher');
$$;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Users may only change these columns; premium and institute are set by the server.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, target_exam, lang) on public.profiles to authenticated;

drop policy if exists "own attempts read" on public.attempts;
create policy "own attempts read" on public.attempts for select using (user_id = auth.uid());
-- attempts, daily_results and mock_results are inserted by the server after scoring (service role).

drop policy if exists "own daily read" on public.daily_results;
create policy "own daily read" on public.daily_results for select using (user_id = auth.uid());

drop policy if exists "own mocks read" on public.mock_results;
create policy "own mocks read" on public.mock_results for select using (user_id = auth.uid());

drop policy if exists "own ai usage read" on public.ai_usage;
create policy "own ai usage read" on public.ai_usage for select using (user_id = auth.uid());

drop policy if exists "own payments read" on public.payments;
create policy "own payments read" on public.payments for select using (user_id = auth.uid());

drop policy if exists "institute visible to members" on public.institutes;
create policy "institute visible to members" on public.institutes for select using (
  owner_id = auth.uid() or exists (select 1 from institute_members m where m.institute_id = institutes.id and m.user_id = auth.uid())
);

drop policy if exists "members visible to staff or self" on public.institute_members;
create policy "members visible to staff or self" on public.institute_members for select using (
  user_id = auth.uid() or public.is_institute_staff(institute_id)
);

-- ============ Public read functions (leaderboards expose only name + score) ============
create or replace function public.daily_leaderboard(p_date date, p_institute uuid default null, p_limit int default 50)
returns table (rank bigint, display_name text, score int, time_ms int, is_me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by d.score desc, d.time_ms asc) as rank,
         coalesce(nullif(p.display_name, ''), 'Aspirant') as display_name,
         d.score, d.time_ms, d.user_id = auth.uid() as is_me
  from daily_results d
  join profiles p on p.id = d.user_id
  where d.date = p_date
    and (p_institute is null or exists (select 1 from institute_members m where m.institute_id = p_institute and m.user_id = d.user_id))
  order by d.score desc, d.time_ms asc
  limit least(p_limit, 100);
$$;

create or replace function public.mock_leaderboard(p_slug text, p_limit int default 50)
returns table (rank bigint, display_name text, score numeric, time_ms int, is_me boolean)
language sql stable security definer set search_path = public as $$
  -- best attempt per user
  with best as (
    select distinct on (user_id) user_id, score, time_ms
    from mock_results where mock_slug = p_slug
    order by user_id, score desc, time_ms asc
  )
  select rank() over (order by b.score desc, b.time_ms asc), coalesce(nullif(p.display_name, ''), 'Aspirant'),
         b.score, b.time_ms, b.user_id = auth.uid()
  from best b join profiles p on p.id = b.user_id
  order by b.score desc, b.time_ms asc
  limit least(p_limit, 100);
$$;

-- Institute dashboard: per-student stats for the last 7 days (staff only).
create or replace function public.institute_report(p_institute uuid)
returns table (user_id uuid, display_name text, role text, days_played bigint, avg_daily numeric, attempts bigint, accuracy numeric, last_active timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, coalesce(nullif(p.display_name, ''), 'Aspirant'), m.role,
         (select count(*) from daily_results d where d.user_id = m.user_id and d.date >= current_date - 6),
         (select round(avg(d.score), 1) from daily_results d where d.user_id = m.user_id and d.date >= current_date - 6),
         (select count(*) from attempts a where a.user_id = m.user_id and a.created_at >= now() - interval '7 days'),
         (select round(100.0 * avg(case when a.correct then 1 else 0 end), 0) from attempts a where a.user_id = m.user_id and a.created_at >= now() - interval '7 days'),
         (select max(a.created_at) from attempts a where a.user_id = m.user_id)
  from institute_members m join profiles p on p.id = m.user_id
  where m.institute_id = p_institute and public.is_institute_staff(p_institute)
  order by 5 desc nulls last;
$$;

-- Join an institute with its 6-character code.
create or replace function public.join_institute(p_code text)
returns table (institute_id uuid, name text)
language plpgsql security definer set search_path = public as $$
declare inst institutes;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into inst from institutes where code = upper(trim(p_code));
  if inst.id is null then raise exception 'invalid code'; end if;
  if inst.active_until < now() then raise exception 'institute plan expired'; end if;
  insert into institute_members (institute_id, user_id) values (inst.id, auth.uid()) on conflict do nothing;
  update profiles set institute_id = inst.id where id = auth.uid();
  return query select inst.id, inst.name;
end $$;

-- Create an institute (14-day trial). The owner is also added as a teacher.
create or replace function public.create_institute(p_name text)
returns table (institute_id uuid, code text)
language plpgsql security definer set search_path = public as $$
declare new_code text; inst_id uuid;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if (select count(*) from institutes where owner_id = auth.uid()) >= 3 then raise exception 'limit reached'; end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from institutes where institutes.code = new_code);
  end loop;
  insert into institutes (name, code, owner_id) values (trim(p_name), new_code, auth.uid()) returning id into inst_id;
  insert into institute_members (institute_id, user_id, role) values (inst_id, auth.uid(), 'teacher');
  return query select inst_id, new_code;
end $$;

revoke all on function public.daily_leaderboard(date, uuid, int) from public;
revoke all on function public.mock_leaderboard(text, int) from public;
revoke all on function public.institute_report(uuid) from public;
revoke all on function public.join_institute(text) from public;
revoke all on function public.create_institute(text) from public;
grant execute on function public.daily_leaderboard(date, uuid, int) to anon, authenticated;
grant execute on function public.mock_leaderboard(text, int) to anon, authenticated;
grant execute on function public.institute_report(uuid) to authenticated;
grant execute on function public.join_institute(text) to authenticated;
grant execute on function public.create_institute(text) to authenticated;
