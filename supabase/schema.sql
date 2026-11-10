-- SAGE database schema. Run this in Supabase → SQL Editor (paste and Run).
-- Row-Level Security makes every row private to its owner.

-- ── Profiles: one row per user, created automatically on signup ──────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text,
  plan        text default 'free',      -- 'free' | 'active'
  limit_hours numeric default 2,
  streak_days int default 0,
  puck_name   text default 'Sage',
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles read own"   on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- ── Daily usage: one row per app per day (fed by the app from Screen Time) ───
create table if not exists public.usage_days (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users on delete cascade not null,
  day        date not null,
  app        text not null,
  minutes    numeric default 0,
  necessity  boolean default false,
  unique (user_id, day, app)
);
alter table public.usage_days enable row level security;

drop policy if exists "usage all own" on public.usage_days;
create policy "usage all own" on public.usage_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Auto-create a profile row whenever a new user signs up ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Account deletion (Apple requires in-app deletion) ────────────────────────
-- Lets a signed-in user delete their own auth account + cascade their data.
create or replace function public.delete_me()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_me() from public;
grant execute on function public.delete_me() to authenticated;
