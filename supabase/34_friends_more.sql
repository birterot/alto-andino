-- More with friends: their coffees with the best recipe, what is trending among your friends, a barista board,
-- a profile page for each person (with an optional photo and a short line about you), and household members
-- for a while only (an invite with an end date).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 33_friend_guests.sql). Safe to run again.

begin;

-- 1. What you share -------------------------------------------------------------------------------------
-- a coffee can be kept from friends (its page, "Hide from friends"); the household switch is "Coffees and recipes"
alter table public.coffees add column if not exists friends_hidden boolean not null default false;
-- your profile: a photo (in the "avatars" bucket) and one short line, both optional
alter table public.profiles add column if not exists photo_path text check (photo_path is null or char_length(photo_path) <= 200);
alter table public.profiles add column if not exists about text check (about is null or char_length(about) <= 140);

-- 2. Members for a while: an invite can carry an end date, and the membership ends by itself then ----------
alter table public.household_members add column if not exists until timestamptz;
alter table public.household_invites add column if not exists member_until timestamptz;

-- the helpers every access rule uses now leave out memberships that have ended
create or replace function public.is_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid() and (until is null or until > now()))
$$;
create or replace function public.shares_household(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select uid = auth.uid() or exists (
    select 1 from household_members a join household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = uid and (a.until is null or a.until > now()) and (b.until is null or b.until > now()))
$$;
create or replace function public.is_friend(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships f join household_members m on m.household_id = case when f.a = hid then f.b else f.a end
    where (f.a = hid or f.b = hid) and m.user_id = auth.uid() and (m.until is null or m.until > now()))
$$;
-- a person you may see: in one of your households, or in a household you are friends with
create or replace function public.can_see_person(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select shares_household(uid) or exists (
    select 1 from household_members m where m.user_id = uid and (m.until is null or m.until > now()) and is_friend(m.household_id))
$$;
-- does this household share its coffees with friends? (on unless switched off)
create or replace function public.shares_coffees(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (share ->> 'coffees')::boolean from households where id = hid), true)
$$;

drop function if exists public.create_invite(uuid);
create or replace function public.create_invite(p_household uuid, p_until timestamptz default null) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  if p_until is not null and p_until <= now() then raise exception 'The end date has to be in the future.'; end if;
  c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into household_invites (code, household_id, created_by, member_until) values (c, p_household, auth.uid(), p_until);
  return c;
end $$;

create or replace function public.join_household(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv household_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into inv from household_invites where code = upper(btrim(coalesce(p_code, ''))) for update;
  if not found or inv.expires_at < now() then raise exception 'This invite is not valid or has expired.'; end if;
  if inv.used_by is not null and inv.used_by <> auth.uid() then raise exception 'This invite has already been used.'; end if;
  if inv.member_until is not null and inv.member_until <= now() then raise exception 'This invite was for a time that is over.'; end if;
  -- someone whose time ran out can come back with a new invite: the old row is replaced
  delete from household_members where household_id = inv.household_id and user_id = auth.uid() and until is not null and until <= now();
  insert into household_members (household_id, user_id, role, until) values (inv.household_id, auth.uid(), 'member', inv.member_until)
  on conflict (household_id, user_id) do nothing;
  update household_invites set used_by = auth.uid(), used_at = coalesce(used_at, now()) where code = inv.code;
  return inv.household_id;
end $$;

-- end someone's time early, give them more time, or make them a full member (p_until null)
create or replace function public.set_member_until(p_household uuid, p_user uuid, p_until timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  update household_members set until = p_until where household_id = p_household and user_id = p_user;
end $$;

-- 3. Sharing switches, now with "coffees" ------------------------------------------------------------------
create or replace function public.set_sharing(p_household uuid, p_share jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  s := jsonb_build_object(
    'stats', coalesce((p_share ->> 'stats')::boolean, true),
    'favourites', coalesce((p_share ->> 'favourites')::boolean, true),
    'taste', coalesce((p_share ->> 'taste')::boolean, true),
    'coffees', coalesce((p_share ->> 'coffees')::boolean, true));
  update households set share = s where id = p_household;
  return s;
end $$;

-- 4. A household's coffees, as friends see them: the latest bag of each coffee, its stars and tasting notes,
--    and the recipe of its best brew. Your own household sees the same (that is "See your page as friends see it").
create or replace function public.friend_coffees(p_household uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare own boolean := is_member(p_household);
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if not own and not is_friend(p_household) then raise exception 'You are not friends with this household.'; end if;
  if not own and not shares_coffees(p_household) then return '[]'::jsonb; end if;
  return coalesce((
    with c as (
      select c.*, coalesce(c.group_id, c.id) g from coffees c where c.household_id = p_household and not c.friends_hidden
    ), stars as (   -- one value per brew: the average of everyone who rated it (dial-ins left out)
      select b.id, c.g, b.brewed_at, coalesce(avg(r.rating), b.rating) s
      from brews b join c on c.id = b.coffee_id left join brew_ratings r on r.brew_id = b.id and r.rating is not null
      where not coalesce(b.is_dialin, false) group by b.id, c.g, b.brewed_at, b.rating
    ), agg as (
      select g, round(avg(s), 2) stars, count(s) n, max(brewed_at) last from stars group by g
    ), best as (
      select distinct on (st.g) st.g, b.device, b.grind, b.dose_g, b.yield_g, b.water_g, b.time_s, b.temp_c, b.recipe, st.s stars,
             coalesce(p.display_name, 'Someone') maker, coalesce(b.made_by, b.created_by) maker_id
      from stars st join brews b on b.id = st.id left join profiles p on p.id = coalesce(b.made_by, b.created_by)
      where st.s is not null order by st.g, st.s desc, st.brewed_at desc
    ), notes as (
      select c.g, s.attribute, count(*) k from brew_scores s join brews b on b.id = s.brew_id join c on c.id = b.coffee_id
      where s.attribute not in ('sour', 'sweet', 'bitter', 'body', 'balance') and s.score >= 3 group by c.g, s.attribute
    ), last as (
      select distinct on (g) * from c order by g, created_at desc
    )
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'roaster', l.roaster, 'origin', l.origin, 'process', l.process, 'roast', l.roast_level, 'variety', l.variety,
      'alt_min', l.altitude_min_m, 'alt_max', l.altitude_max_m, 'url', l.buy_url, 'photo', l.photo_path, 'decaf', coalesce(l.is_decaf, false),
      'open', l.open_date is not null and l.finished_at is null and not coalesce(l.archived, false),
      'stars', a.stars, 'n', coalesce(a.n, 0), 'last', a.last,
      'notes', coalesce((select jsonb_agg(attribute order by k desc, attribute) from (select * from notes where notes.g = l.g order by k desc limit 5) x), '[]'::jsonb),
      'best', (select jsonb_build_object('device', device, 'grind', grind, 'dose', dose_g, 'yield', yield_g, 'water', water_g, 'time', time_s, 'temp', temp_c,
                                         'recipe', recipe, 'stars', round(stars, 2), 'maker', maker, 'maker_id', maker_id) from best where best.g = l.g)
    ) order by (l.open_date is not null and l.finished_at is null and not coalesce(l.archived, false)) desc, a.last desc nulls last, l.created_at desc)
    from last l left join agg a on a.g = l.g
  ), '[]'::jsonb);
end $$;

-- 5. Trending among your friends: their coffees rated best in the last 30 days (two ratings or more)
create or replace function public.friend_trending(p_household uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  return coalesce((
    with fh as (
      select case when f.a = p_household then f.b else f.a end id from friendships f where f.a = p_household or f.b = p_household
    ), r as (
      select c.household_id h, coalesce(c.group_id, c.id) g, r.rating from brew_ratings r join brews b on b.id = r.brew_id join coffees c on c.id = b.coffee_id
      where c.household_id in (select id from fh) and not c.friends_hidden and shares_coffees(c.household_id)
        and r.rating is not null and not coalesce(b.is_dialin, false) and b.brewed_at > now() - interval '30 days'
    ), t as (
      select h, g, round(avg(rating), 2) stars, count(*) n from r group by h, g having count(*) >= 2
    )
    select jsonb_agg(x order by (x ->> 'stars')::numeric desc, (x ->> 'n')::int desc) from (
      select jsonb_build_object('household', t.h, 'household_name', hh.name, 'id', l.id, 'name', l.name, 'roaster', l.roaster, 'origin', l.origin, 'photo', l.photo_path, 'stars', t.stars, 'n', t.n) x
      from t join households hh on hh.id = t.h
      join lateral (select * from coffees where coalesce(group_id, id) = t.g and not friends_hidden order by created_at desc limit 1) l on true
      order by t.stars desc, t.n desc limit 6
    ) y
  ), '[]'::jsonb);
end $$;

-- 6. The barista board: everyone in your household and in your friends' households (where they share their stats),
--    with the average stars their brews got over the last 90 days (three rated brews or more)
create or replace function public.barista_board(p_household uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  return coalesce((
    with hs as (
      select p_household id union
      select case when f.a = p_household then f.b else f.a end from friendships f where (f.a = p_household or f.b = p_household)
    ), ok as (
      select h.id from hs h join households x on x.id = h.id where h.id = p_household or coalesce((x.share ->> 'stats')::boolean, true)
    ), b as (
      select c.household_id h, coalesce(b.made_by, b.created_by) who, coalesce(avg(r.rating), b.rating) s
      from brews b join coffees c on c.id = b.coffee_id left join brew_ratings r on r.brew_id = b.id and r.rating is not null
      where c.household_id in (select id from ok) and not coalesce(b.is_dialin, false) and b.brewed_at > now() - interval '90 days'
      group by b.id, c.household_id, coalesce(b.made_by, b.created_by), b.rating
    ), p as (
      select who, h, round(avg(s), 2) stars, count(s) n, count(*) brews from b where who is not null group by who, h having count(s) >= 3
    )
    select jsonb_agg(jsonb_build_object('id', p.who, 'name', coalesce(pr.display_name, 'Someone'), 'color', pr.prefs ->> 'color', 'photo', pr.photo_path,
                                        'household', p.h, 'household_name', hh.name, 'mine', p.h = p_household, 'stars', p.stars, 'n', p.n, 'brews', p.brews)
                     order by p.stars desc, p.n desc)
    from p join households hh on hh.id = p.h left join profiles pr on pr.id = p.who
  ), '[]'::jsonb);
end $$;

-- 7. A person's profile: for the people of your households and of your friends' households
create or replace function public.person_profile(p_user uuid, p_tz text default 'UTC') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare tz text := 'UTC'; res jsonb;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if not can_see_person(p_user) then raise exception 'This profile is not one you can see.'; end if;
  if exists (select 1 from pg_timezone_names where name = p_tz) then tz := p_tz; end if;
  with vis as (   -- the households of this person whose coffees you may see
    select m.household_id id from household_members m where m.user_id = p_user and (m.until is null or m.until > now())
      and (is_member(m.household_id) or (is_friend(m.household_id) and shares_coffees(m.household_id)))
  ), made as (
    select b.*, coalesce((select avg(r.rating) from brew_ratings r where r.brew_id = b.id and r.rating is not null), b.rating) s
    from brews b join coffees c on c.id = b.coffee_id where c.household_id in (select id from vis) and coalesce(b.made_by, b.created_by) = p_user
  ), mine as (
    select r.rating, coalesce(c.group_id, c.id) g, b.brewed_at from brew_ratings r join brews b on b.id = r.brew_id join coffees c on c.id = b.coffee_id
    where r.rater_id = p_user and not r.is_guest and r.rating is not null and c.household_id in (select id from vis) and not c.friends_hidden and not coalesce(b.is_dialin, false)
  ), fav as (
    select g, round(avg(rating), 2) stars, count(*) n from mine group by g having count(*) >= 2 order by avg(rating) desc, count(*) desc limit 1
  )
  select jsonb_build_object(
    'id', p.id, 'name', p.display_name, 'color', p.prefs ->> 'color', 'photo', p.photo_path, 'about', p.about, 'me', p.id = auth.uid(),
    'drink_esp', p.prefs ->> 'drink_esp', 'drink_filter', p.prefs ->> 'drink_filter', 'milk', p.prefs ->> 'milk',
    'households', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'until', m.until, 'friend', not is_member(h.id)) order by m.joined_at)
                            from household_members m join households h on h.id = m.household_id
                            where m.user_id = p_user and (m.until is null or m.until > now()) and (is_member(h.id) or is_friend(h.id))), '[]'::jsonb),
    'since', (select min(joined_at) from household_members where user_id = p_user),
    'brews', (select count(*) from made), 'brews_30', (select count(*) from made where brewed_at > now() - interval '30 days'),
    'barista', (select round(avg(s), 2) from made where s is not null and not coalesce(is_dialin, false)),
    'barista_n', (select count(s) from made where s is not null and not coalesce(is_dialin, false)),
    'cups', (select count(*) from mine),
    'device', (select device from made where nullif(device, '') is not null group by device order by count(*) desc limit 1),
    'hour', (select extract(hour from (brewed_at at time zone tz))::int from made group by 1 order by count(*) desc limit 1),
    'fav', (select jsonb_build_object('id', l.id, 'name', l.name, 'roaster', l.roaster, 'household', l.household_id, 'stars', fav.stars, 'n', fav.n)
            from fav join lateral (select * from coffees where coalesce(group_id, id) = fav.g and not friends_hidden order by created_at desc limit 1) l on true)
  ) into res from profiles p where p.id = p_user;
  return res;
end $$;

-- 8. Photos: friends may see the bag photos of coffees shared with them, and everyone the profile photos of the people they can see
create or replace function public.friend_photo_ok(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from coffees c where (c.photo_path = path or regexp_replace(c.photo_path, '\.jpe?g$', '', 'i') || '-t.jpg' = path)   -- the photo or its small copy
    and not c.friends_hidden and is_friend(c.household_id) and shares_coffees(c.household_id))
$$;
drop policy if exists "friend photos read" on storage.objects;
create policy "friend photos read" on storage.objects for select to authenticated
  using (bucket_id = 'bag-photos' and public.friend_photo_ok(name));

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false) on conflict (id) do nothing;
create or replace function public.avatar_ok(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f-]{36}$' then public.can_see_person(split_part(path, '/', 1)::uuid) else false end
$$;
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select to authenticated using (bucket_id = 'avatars' and public.avatar_ok(name));
drop policy if exists "avatars add" on storage.objects;
create policy "avatars add" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);
drop policy if exists "avatars remove" on storage.objects;
create policy "avatars remove" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

-- 9. Who may call what
revoke all on function public.friend_coffees(uuid), public.friend_trending(uuid), public.barista_board(uuid), public.person_profile(uuid, text),
  public.set_member_until(uuid, uuid, timestamptz), public.create_invite(uuid, timestamptz) from public, anon;
grant execute on function public.friend_coffees(uuid), public.friend_trending(uuid), public.barista_board(uuid), public.person_profile(uuid, text),
  public.set_member_until(uuid, uuid, timestamptz), public.create_invite(uuid, timestamptz), public.can_see_person(uuid), public.shares_coffees(uuid),
  public.friend_photo_ok(text), public.avatar_ok(text) to authenticated;

commit;
