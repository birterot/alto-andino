-- Several people can taste and rate the same brew: you, Andrés, a guest ("Lena", or just "Guest"),
-- and later friends. Each rating has its own stars and its own taste scores and tasting notes.
-- Who made the brew (brews.made_by) stays separate from who rated it.
--
-- Existing brews get one rating each, by the person who made them (or logged them), with their stars and scores.
-- brews.rating is kept as the average of all ratings, so older parts of the app keep working.
--
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 15_households.sql). Safe to run again.
-- It runs as one block: if anything fails, nothing is changed.

begin;

-- 1. One row per person who rated a brew -------------------------------------------------------------
create table if not exists public.brew_ratings (
  id uuid primary key default gen_random_uuid(),
  brew_id uuid not null references public.brews(id) on delete cascade,
  rater_id uuid references auth.users(id) on delete set null,   -- a member (later: a friend)
  is_guest boolean not null default false,                      -- a guest without a login
  guest_name text check (guest_name is null or char_length(guest_name) <= 60),
  rating numeric(2,1) check (rating is null or (rating between 0.5 and 5 and rating * 2 = trunc(rating * 2))),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists brew_ratings_brew_idx on public.brew_ratings(brew_id);
create index if not exists brew_ratings_rater_idx on public.brew_ratings(rater_id);
-- each member rates a brew once (guests can be several)
create unique index if not exists brew_ratings_one_per_member on public.brew_ratings(brew_id, rater_id) where rater_id is not null and not is_guest;

alter table public.brew_ratings enable row level security;
grant select, insert, update, delete on public.brew_ratings to authenticated;
drop policy if exists "household" on public.brew_ratings;
create policy "household" on public.brew_ratings for all to authenticated
  using (exists (select 1 from public.brews b join public.coffees c on c.id = b.coffee_id where b.id = brew_ratings.brew_id and public.is_member(c.household_id)))
  with check (exists (select 1 from public.brews b join public.coffees c on c.id = b.coffee_id where b.id = brew_ratings.brew_id and public.is_member(c.household_id)));

-- 2. Taste scores belong to a rating ---------------------------------------------------------------------
alter table public.brew_scores add column if not exists rating_id uuid references public.brew_ratings(id) on delete cascade;

-- 3. Existing brews: one rating each, by whoever made it (or logged it) ------------------------------------
insert into public.brew_ratings (brew_id, rater_id, rating, created_by, created_at)
select b.id, coalesce(b.made_by, b.created_by), b.rating, b.created_by, coalesce(b.brewed_at, now())
from public.brews b
where (b.rating is not null or exists (select 1 from public.brew_scores s where s.brew_id = b.id))
  and not exists (select 1 from public.brew_ratings r where r.brew_id = b.id);
update public.brew_scores s set rating_id = r.id
from public.brew_ratings r
where s.rating_id is null and r.brew_id = s.brew_id
  and r.id = (select r2.id from public.brew_ratings r2 where r2.brew_id = s.brew_id order by r2.created_at, r2.id limit 1);

-- 4. Scores without a rating (from an app that is not updated yet) join the brew's first rating,
--    or a new one by whoever made the brew.
create or replace function public.brew_score_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if new.rating_id is null then
    select id into rid from brew_ratings where brew_id = new.brew_id order by created_at, id limit 1;
    if rid is null then
      insert into brew_ratings (brew_id, rater_id, rating, created_by)
      select b.id, coalesce(b.made_by, b.created_by, auth.uid()), b.rating, auth.uid() from brews b where b.id = new.brew_id
      returning id into rid;
    end if;
    new.rating_id := rid;
  end if;
  return new;
end $$;
drop trigger if exists brew_score_rating on public.brew_scores;
create trigger brew_score_rating before insert on public.brew_scores for each row execute function public.brew_score_rating();

-- 5. The same taste attribute can now appear once per rating instead of once per brew
alter table public.brew_scores alter column rating_id set not null;
alter table public.brew_scores drop constraint if exists brew_scores_pkey;
alter table public.brew_scores add constraint brew_scores_pkey primary key (rating_id, attribute);
create index if not exists brew_scores_brew_idx on public.brew_scores(brew_id);

commit;
