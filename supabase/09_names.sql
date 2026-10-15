-- Names: everyone who signs in can choose the name shown on their brews.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.

-- 1. One row per login with the chosen name. Everyone signed in can read the names,
--    but each person can only set their own.
create table if not exists profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "profiles read" on profiles;
create policy "profiles read" on profiles for select to authenticated using (true);
drop policy if exists "profiles insert own" on profiles;
create policy "profiles insert own" on profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 2. Every new brew remembers who was signed in.
alter table brews add column if not exists created_by uuid;
alter table brews alter column created_by set default auth.uid();

-- 3. Optional, for old brews that have no name yet. To give all of them to one person,
--    put that person's email in, remove the two dashes at the start of the line and run it.
-- update brews set created_by = (select id from auth.users where email = 'name@example.com') where created_by is null;
