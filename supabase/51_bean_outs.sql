-- Beans out: coffee that left a bag without being brewed (for a tiramisu, spilled, given away), or a correction after
-- weighing the bag. It counts for what is left in the bag, not as a brew (Trends, ratings and caffeine leave it out).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create table if not exists public.bean_outs (
  id uuid primary key default gen_random_uuid(),
  coffee_id uuid not null references public.coffees(id) on delete cascade,
  grams numeric(6,1) not null check (grams <> 0 and grams between -5000 and 5000),   -- a correction can also give grams back
  reason text not null default 'other' check (reason in ('cooking', 'spilled', 'gift', 'other', 'weighed')),
  note text check (note is null or char_length(note) <= 120),
  at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);
create index if not exists bean_outs_coffee on public.bean_outs(coffee_id);
alter table public.bean_outs enable row level security;
revoke all on public.bean_outs from anon;
grant select, insert, delete on public.bean_outs to authenticated;
drop policy if exists "household" on public.bean_outs;
create policy "household" on public.bean_outs for all to authenticated
  using (exists (select 1 from public.coffees c where c.id = bean_outs.coffee_id and public.is_member(c.household_id)))
  with check (exists (select 1 from public.coffees c where c.id = bean_outs.coffee_id and public.is_member(c.household_id)));

commit;
