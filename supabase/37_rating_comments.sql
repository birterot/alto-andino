-- Comments: the brew's comment is about the brew (by whoever made it); each taster now has a comment of their own on their rating.
-- Old comments stay where they are (with the brew).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 33_friend_guests.sql). Safe to run again.

begin;

alter table public.brew_ratings add column if not exists note text check (note is null or char_length(note) <= 1000);

-- cups at a friend's: with your comment
drop function if exists public.my_guest_cups();
create or replace function public.my_guest_cups()
returns table (rating_id uuid, brew_id uuid, brewed_at timestamptz, device text, dose_g numeric, yield_g numeric, water_g numeric,
               coffee_name text, roaster text, roast_level text, is_decaf boolean, variety text, maker text, household text,
               rating numeric, balance smallint, drank_at timestamptz, drink text, milk text, cups int, scores jsonb, note text)
language sql stable security definer set search_path = public as $$
  select r.id, b.id, b.brewed_at, b.device, b.dose_g, b.yield_g, b.water_g,
         c.name, c.roaster, c.roast_level, coalesce(c.is_decaf, false), c.variety, coalesce(p.display_name, 'A friend'), h.name,
         r.rating, r.balance, r.drank_at, r.drink, r.milk,
         (select count(*)::int from brew_ratings x where x.brew_id = b.id),
         coalesce((select jsonb_object_agg(s.attribute, s.score) from brew_scores s where s.rating_id = r.id), '{}'::jsonb),
         r.note
  from brew_ratings r
  join brews b on b.id = r.brew_id
  join coffees c on c.id = b.coffee_id
  join households h on h.id = c.household_id
  left join profiles p on p.id = coalesce(b.made_by, b.created_by)
  where r.rater_id = auth.uid() and not r.is_guest and not is_member(c.household_id)
    and b.brewed_at > now() - interval '62 days'
    and exists (select 1 from friendships f join household_members m on m.user_id = auth.uid()
                where (f.a = m.household_id and f.b = c.household_id) or (f.b = m.household_id and f.a = c.household_id))
  order by b.brewed_at desc
$$;

-- rating a cup at a friend's: now with your comment
drop function if exists public.rate_guest_cup(uuid, numeric, smallint, text, timestamptz, jsonb);
create or replace function public.rate_guest_cup(p_rating uuid, p_stars numeric, p_balance smallint, p_drink text, p_drank_at timestamptz, p_scores jsonb, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  update brew_ratings set rating = p_stars, balance = p_balance, drink = nullif(p_drink, ''), drank_at = p_drank_at,
         note = nullif(left(btrim(coalesce(p_note, '')), 1000), '')
  where id = p_rating and rater_id = auth.uid() and not is_guest
  returning brew_id into bid;
  if bid is null then raise exception 'This is not your cup.'; end if;
  delete from brew_scores where rating_id = p_rating;
  insert into brew_scores (brew_id, rating_id, attribute, score)
    select bid, p_rating, k, least(10, greatest(0, round(v::numeric)))::smallint
    from jsonb_each_text(coalesce(p_scores, '{}'::jsonb)) as e(k, v)
    where k in ('sour', 'sweet', 'bitter', 'body') and v ~ '^[0-9.]+$';
  update brews set rating = (select round(avg(rating) * 2) / 2 from brew_ratings where brew_id = bid and rating is not null) where id = bid;
end $$;

revoke all on function public.my_guest_cups() from public, anon;
revoke all on function public.rate_guest_cup(uuid, numeric, smallint, text, timestamptz, jsonb, text) from public, anon;
grant execute on function public.my_guest_cups() to authenticated;
grant execute on function public.rate_guest_cup(uuid, numeric, smallint, text, timestamptz, jsonb, text) to authenticated;

commit;
