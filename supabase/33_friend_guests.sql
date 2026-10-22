-- Friends as guests: when you make a coffee for a friend (from a household you are friends with), you pick them
-- under "For". The cup shows up in their own app as "to rate"; they rate it on their phone, and the rating counts
-- in your household like everyone else's. They only see the cups that were for them, nothing else of yours.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 23_friends.sql). Safe to run again.

begin;

-- the people in households your household is friends with (for "For" in the brew form)
create or replace function public.friend_people(p_household uuid)
returns table (user_id uuid, name text, household text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  return query
    select m.user_id, coalesce(p.display_name, 'Friend'), h.name
    from friendships f
    join households h on h.id = case when f.a = p_household then f.b else f.a end
    join household_members m on m.household_id = h.id
    left join profiles p on p.id = m.user_id
    where (f.a = p_household or f.b = p_household) and m.user_id <> auth.uid()
    order by h.name, 2;
end $$;

-- the cups friends made for you (the last two months), while you are still friends
create or replace function public.my_guest_cups()
returns table (rating_id uuid, brew_id uuid, brewed_at timestamptz, device text, dose_g numeric, yield_g numeric, water_g numeric,
               coffee_name text, roaster text, roast_level text, is_decaf boolean, variety text, maker text, household text,
               rating numeric, balance smallint, drank_at timestamptz, drink text, milk text, cups int, scores jsonb)
language sql stable security definer set search_path = public as $$
  select r.id, b.id, b.brewed_at, b.device, b.dose_g, b.yield_g, b.water_g,
         c.name, c.roaster, c.roast_level, coalesce(c.is_decaf, false), c.variety, coalesce(p.display_name, 'A friend'), h.name,
         r.rating, r.balance, r.drank_at, r.drink, r.milk,
         (select count(*)::int from brew_ratings x where x.brew_id = b.id),
         coalesce((select jsonb_object_agg(s.attribute, s.score) from brew_scores s where s.rating_id = r.id), '{}'::jsonb)
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

-- rating such a cup: only your own rating, and the brew's stars are worked out again
create or replace function public.rate_guest_cup(p_rating uuid, p_stars numeric, p_balance smallint, p_drink text, p_drank_at timestamptz, p_scores jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare bid uuid;
begin
  update brew_ratings set rating = p_stars, balance = p_balance, drink = nullif(p_drink, ''), drank_at = p_drank_at
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

revoke all on function public.friend_people(uuid) from public, anon;
revoke all on function public.my_guest_cups() from public, anon;
revoke all on function public.rate_guest_cup(uuid, numeric, smallint, text, timestamptz, jsonb) from public, anon;
grant execute on function public.friend_people(uuid) to authenticated;
grant execute on function public.my_guest_cups() to authenticated;
grant execute on function public.rate_guest_cup(uuid, numeric, smallint, text, timestamptz, jsonb) to authenticated;

commit;
