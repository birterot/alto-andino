-- Sleep check (optional, turned on in Settings): one answer per person and night, 1 = badly, 2 = okay, 3 = well.
-- Only you see your own. Home compares it with your coffee to give a tip, e.g. "maybe no coffee after 14:00".
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

create table if not exists public.sleep_logs (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  night date not null,                 -- the evening the night started
  quality smallint not null check (quality between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, night)
);
alter table public.sleep_logs enable row level security;
grant select, insert, update, delete on public.sleep_logs to authenticated;
drop policy if exists "own" on public.sleep_logs;
create policy "own" on public.sleep_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
