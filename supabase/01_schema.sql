-- Stage 1: real tables, access rules and photo storage.
-- Run once in Supabase: SQL Editor, New query, paste, Run.

-- Remove the open test table from Stage 0
drop table if exists stage0_test;

create table coffees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roaster text,
  origin text,
  is_blend boolean not null default false,
  process text,
  roast_level text,
  flavour_tags text[] not null default '{}',
  notes text,
  roast_date date,
  open_date date,
  photo_path text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table brews (
  id uuid primary key default gen_random_uuid(),
  coffee_id uuid not null references coffees(id) on delete cascade,
  brewed_at timestamptz not null default now(),
  device text,
  grind text,
  pressure_bar numeric,
  dose_g numeric,
  yield_g numeric,
  time_s numeric,
  recipe text,
  notes text,
  created_by uuid default auth.uid()
);

create table brew_scores (
  brew_id uuid not null references brews(id) on delete cascade,
  attribute text not null,
  score smallint not null check (score between 0 and 10),
  primary key (brew_id, attribute)
);

-- Only logged-in users get access. Anonymous visitors get nothing.
alter table coffees enable row level security;
alter table brews enable row level security;
alter table brew_scores enable row level security;

grant select, insert, update, delete on coffees, brews, brew_scores to authenticated;

create policy "members all" on coffees for all to authenticated using (true) with check (true);
create policy "members all" on brews for all to authenticated using (true) with check (true);
create policy "members all" on brew_scores for all to authenticated using (true) with check (true);

-- Private bucket for bag photos
insert into storage.buckets (id, name, public) values ('bag-photos', 'bag-photos', false)
on conflict (id) do nothing;

create policy "members photos" on storage.objects for all to authenticated
  using (bucket_id = 'bag-photos') with check (bucket_id = 'bag-photos');
