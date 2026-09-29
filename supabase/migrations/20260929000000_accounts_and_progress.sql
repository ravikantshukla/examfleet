-- ExamFleet: user profiles and synced progress (streaks, best scores, subject accuracy).
-- Every table has row-level security: a signed-in user can only read and write their own rows.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url   text,
  lang         text not null default 'en' check (lang in ('en', 'hi')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- progress: mirrors the browser's localStorage progress (one row per user)
-- ---------------------------------------------------------------------------
create table public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  streak     integer not null default 0 check (streak >= 0),
  last_daily date,
  best_speed integer not null default 0 check (best_speed between 0 and 1000),
  -- { "<subject>": { "right": n, "total": n } }
  subjects   jsonb not null default '{}'::jsonb check (jsonb_typeof(subjects) = 'object'),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- daily_scores: one row per user per daily challenge (first attempt only)
-- Kept as its own table so leaderboards can be built on it later.
-- ---------------------------------------------------------------------------
create table public.daily_scores (
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  score      smallint not null check (score between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index daily_scores_day_score_idx on public.daily_scores (day, score desc);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile + empty progress row for every new user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.progress (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.progress     enable row level security;
alter table public.daily_scores enable row level security;

create policy "profiles: read own"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "progress: read own"   on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress: insert own" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress: update own" on public.progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Daily scores can be added but never changed or deleted by the user.
create policy "daily_scores: read own"   on public.daily_scores for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_scores: insert own" on public.daily_scores for insert to authenticated with check ((select auth.uid()) = user_id);
