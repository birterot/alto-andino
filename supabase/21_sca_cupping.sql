-- 1. The official score of a coffee (the SCA cupping score the roaster gives, e.g. 86.5), from the bag.
-- 2. Cupping: now and then you cup one or several coffees side by side. Each person scores each coffee
--    (SCA-style: fragrance, flavour, aftertaste ...), the total is out of 100. Coffees cupped together share a session.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 20_drinks_settings.sql). Safe to run again.

begin;

alter table public.coffees add column if not exists sca_score numeric(5,2) check (sca_score is null or sca_score between 0 and 100);

create table if not exists public.cuppings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,                                     -- the coffees cupped together
  coffee_id uuid not null references public.coffees(id) on delete cascade,
  cupped_at timestamptz not null default now(),
  cupper_id uuid references auth.users(id) on delete set null default auth.uid(),
  is_guest boolean not null default false,
  guest_name text check (guest_name is null or char_length(guest_name) <= 60),
  scores jsonb not null default '{}'::jsonb,                    -- {"fragrance": 7.75, "flavour": 8, ...}
  defects numeric(4,1) not null default 0 check (defects between 0 and 60),
  total numeric(5,2) check (total is null or total between 0 and 100),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists cuppings_coffee_idx on public.cuppings(coffee_id);
create index if not exists cuppings_session_idx on public.cuppings(session_id);

alter table public.cuppings enable row level security;
grant select, insert, update, delete on public.cuppings to authenticated;
drop policy if exists "household" on public.cuppings;
create policy "household" on public.cuppings for all to authenticated
  using (exists (select 1 from public.coffees c where c.id = cuppings.coffee_id and public.is_member(c.household_id)))
  with check (exists (select 1 from public.coffees c where c.id = cuppings.coffee_id and public.is_member(c.household_id)));

commit;
