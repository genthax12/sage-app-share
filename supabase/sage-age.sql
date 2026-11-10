-- SAGE-AGE — "years of life saved from screen time", Whoop-style.
-- Run this in Supabase → SQL Editor AFTER schema.sql.
-- Stores one computed result per user; refreshed every Sunday by a cron job
-- that calls the `sage-age` Edge Function (which does the math + AI headline).

-- ── Age is used to estimate remaining life-years (optional, user-entered) ────
alter table public.profiles add column if not exists age int;

-- ── One row per user: their latest SAGE-AGE result ───────────────────────────
create table if not exists public.sage_age (
  user_id      uuid primary key references auth.users on delete cascade,
  years_saved  numeric,                 -- the headline number (null until 30 days of data)
  avg_hours    numeric,                 -- avg daily screen hours over the window
  cut_hours    numeric,                 -- hours/day saved vs. baseline
  days_tracked int default 0,           -- how many days of data we have (need 30)
  ready        boolean default false,   -- true once days_tracked >= 30
  headline     text,                    -- short AI-written shareable line
  updated_at   timestamptz default now()
);
alter table public.sage_age enable row level security;

drop policy if exists "sage_age read own" on public.sage_age;
create policy "sage_age read own" on public.sage_age
  for select using (auth.uid() = user_id);
-- No insert/update policy for users: only the Edge Function (service role) writes here.

-- ── Weekly refresh: every Sunday 08:00 UTC, ping the Edge Function ───────────
-- Requires the pg_cron and pg_net extensions (enable once in Database → Extensions),
-- and two DB settings holding your project URL + a shared cron secret.
-- Set these once in SQL editor (replace the values), then schedule below:
--   select set_config('app.sage_fn_url',   'https://<PROJECT>.supabase.co/functions/v1/sage-age', false);
--   select set_config('app.sage_cron_key', '<same value as CRON_SECRET function secret>', false);
-- NOTE: set_config is session-scoped; for a persistent value use ALTER DATABASE (see SETUP notes).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule with this name, then (re)create it.
select cron.unschedule('sage-age-weekly')
  where exists (select 1 from cron.job where jobname = 'sage-age-weekly');

select cron.schedule(
  'sage-age-weekly',
  '0 8 * * 0',                           -- 08:00 UTC every Sunday
  $$
  select net.http_post(
    url     := current_setting('app.sage_fn_url', true),
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-key',   current_setting('app.sage_cron_key', true)
               ),
    body    := jsonb_build_object('mode', 'all')
  );
  $$
);
