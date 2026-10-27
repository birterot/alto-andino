-- Hearts: everyone can mark coffees and brews as favourites. Each person has their own.
-- kind 'coffee': ref is the coffee (all its bags: the id of its first bag, the same as group_id); kind 'brew': ref is the brew.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create table if not exists public.favourites (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('coffee', 'brew')),
  ref uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.favourites enable row level security;
grant select, insert, delete on public.favourites to authenticated;
drop policy if exists "own" on public.favourites;
create policy "own" on public.favourites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
