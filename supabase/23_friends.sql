-- Friends: households can befriend each other with a friend link, and then see a few fun stats of each other.
-- Friends never see your coffees, brews or notes themselves, only what "household_stats" puts together,
-- and only the parts you share (Settings on the Friends page): fun stats, favourite coffees, taste profile.
-- Either side can unfriend at any time.
--
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.
-- It runs as one block: if anything fails, nothing is changed.

begin;

-- 1. Tables --------------------------------------------------------------------------------------------
-- what friends may see (all on to start with)
alter table public.households add column if not exists share jsonb not null default '{"stats": true, "favourites": true, "taste": true}';

-- a friend link: one code per household, for as many friends as you send it to, valid for 30 days
create table if not exists public.friend_invites (
  code text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists friend_invites_household_idx on public.friend_invites(household_id);

-- a friendship between two households, stored once (a is the smaller id)
create table if not exists public.friendships (
  a uuid not null references public.households(id) on delete cascade,
  b uuid not null references public.households(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index if not exists friendships_b_idx on public.friendships(b);

-- Only the functions below read and change these (no direct access from the app)
alter table public.friend_invites enable row level security;
alter table public.friendships enable row level security;
revoke all on public.friend_invites, public.friendships from anon, authenticated;

-- 2. Helpers ---------------------------------------------------------------------------------------------
-- is this household a friend of one of my households?
create or replace function public.is_friend(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships f join household_members m on m.household_id = case when f.a = hid then f.b else f.a end
    where (f.a = hid or f.b = hid) and m.user_id = auth.uid())
$$;

-- 3. Actions the app calls --------------------------------------------------------------------------------
-- your friend link (the same one until it runs out)
create or replace function public.friend_code(p_household uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  select code into c from friend_invites where household_id = p_household and expires_at > now() + interval '3 days' order by created_at desc limit 1;
  if c is null then
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into friend_invites (code, household_id, created_by) values (c, p_household, auth.uid());
  end if;
  return c;
end $$;

-- a fresh link (the old one stops working)
create or replace function public.new_friend_code(p_household uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  delete from friend_invites where household_id = p_household;
  return friend_code(p_household);
end $$;

-- who sent this link: just the household's name, so you know whom you befriend
create or replace function public.friend_code_info(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select h.id, h.name into r from friend_invites i join households h on h.id = i.household_id
  where i.code = upper(btrim(coalesce(p_code, ''))) and i.expires_at > now();
  if not found then raise exception 'This friend link is not valid or has run out. Ask for a new one.'; end if;
  return jsonb_build_object('id', r.id, 'name', r.name, 'mine', is_member(r.id), 'friends', is_friend(r.id));
end $$;

create or replace function public.befriend(p_household uuid, p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  select household_id into other from friend_invites where code = upper(btrim(coalesce(p_code, ''))) and expires_at > now();
  if other is null then raise exception 'This friend link is not valid or has run out. Ask for a new one.'; end if;
  if other = p_household then raise exception 'This is your own friend link: send it to your friends.'; end if;
  insert into friendships (a, b) values (least(p_household, other), greatest(p_household, other)) on conflict do nothing;
  return other;
end $$;

create or replace function public.unfriend(p_household uuid, p_friend uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  delete from friendships where a = least(p_household, p_friend) and b = greatest(p_household, p_friend);
end $$;

create or replace function public.my_friends(p_household uuid) returns table (id uuid, name text, since timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  return query
    select h.id, h.name, f.created_at from friendships f
    join households h on h.id = case when f.a = p_household then f.b else f.a end
    where f.a = p_household or f.b = p_household
    order by h.name;
end $$;

-- what friends may see: only these three switches are kept
create or replace function public.set_sharing(p_household uuid, p_share jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  s := jsonb_build_object(
    'stats', coalesce((p_share ->> 'stats')::boolean, true),
    'favourites', coalesce((p_share ->> 'favourites')::boolean, true),
    'taste', coalesce((p_share ->> 'taste')::boolean, true));
  update households set share = s where id = p_household;
  return s;
end $$;

-- The stats of one household: your own (everything) or a friend's (only what they share).
-- p_tz is the viewer's time zone, for "days in a row" and the time of day.
create or replace function public.household_stats(p_household uuid, p_tz text default 'UTC') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  own boolean := is_member(p_household);
  sh jsonb; res jsonb; tz text := 'UTC';
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if not own and not is_friend(p_household) then raise exception 'You are not friends with this household.'; end if;
  if exists (select 1 from pg_timezone_names where name = p_tz) then tz := p_tz; end if;
  select coalesce(share, '{}'::jsonb) into sh from households where id = p_household;
  if not found then raise exception 'This household does not exist.'; end if;

  res := jsonb_build_object(
    'id', p_household, 'own', own,
    'name', (select name from households where id = p_household),
    'share', sh,
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', m.user_id, 'name', coalesce(p.display_name, 'Someone')) order by m.joined_at)
                         from household_members m left join profiles p on p.id = m.user_id where m.household_id = p_household), '[]'::jsonb));

  -- fun stats: how much, who, when, with what
  if own or coalesce((sh ->> 'stats')::boolean, true) then
    res := res || jsonb_build_object('stats', (
      with bw as (
        select b.*, coalesce(b.made_by, b.created_by) as who, (b.brewed_at at time zone tz) as lt
        from brews b join coffees c on c.id = b.coffee_id where c.household_id = p_household and b.brewed_at is not null
      )
      select jsonb_build_object(
        'brews', (select count(*) from bw),
        'brews_30', (select count(*) from bw where brewed_at >= now() - interval '30 days'),
        'grams', coalesce((select round(sum(dose_g)) from bw), 0),
        'grams_30', coalesce((select round(sum(dose_g)) from bw where brewed_at >= now() - interval '30 days'), 0),
        'coffees', (select count(distinct coalesce(group_id, id)) from coffees where household_id = p_household),
        'roasters', (select count(distinct lower(btrim(roaster))) from coffees where household_id = p_household and nullif(btrim(roaster), '') is not null),
        'origins', (select count(distinct lower(btrim(split_part(origin, ',', 1)))) from coffees where household_id = p_household and nullif(btrim(origin), '') is not null),
        'avg', (select round(avg(rating), 2) from bw where rating is not null and not coalesce(is_dialin, false)),
        'first', (select min(brewed_at) from bw),
        'people', coalesce((select jsonb_agg(jsonb_build_object('id', who, 'n', n, 'n30', n30) order by n desc)
                   from (select who, count(*) n, count(*) filter (where brewed_at >= now() - interval '30 days') n30 from bw where who is not null group by who) x), '[]'::jsonb),
        'devices', coalesce((select jsonb_agg(jsonb_build_object('device', device, 'n', n) order by n desc)
                    from (select device, count(*) n from bw where nullif(device, '') is not null group by device order by count(*) desc limit 3) x), '[]'::jsonb),
        'hours', (select jsonb_agg(coalesce(n, 0) order by h) from generate_series(0, 23) h
                  left join (select extract(hour from lt)::int hr, count(*) n from bw group by 1) x on x.hr = h),
        'days', coalesce((select jsonb_agg(d order by d desc) from (select distinct lt::date d from bw where brewed_at >= now() - interval '400 days') x), '[]'::jsonb),
        'today', (now() at time zone tz)::date
      )));
  end if;

  -- favourite coffees: the best rated (dial-ins left out), bags of one coffee together
  if own or coalesce((sh ->> 'favourites')::boolean, true) then
    res := res || jsonb_build_object('favourites', coalesce((
      with r as (
        select coalesce(c.group_id, c.id) g, coalesce(avg(r.rating), b.rating) stars
        from brews b join coffees c on c.id = b.coffee_id left join brew_ratings r on r.brew_id = b.id and r.rating is not null
        where c.household_id = p_household and not coalesce(b.is_dialin, false)
        group by b.id, coalesce(c.group_id, c.id), b.rating
      ), g as (
        select g, round(avg(stars), 2) stars, count(*) n from r where stars is not null group by g
      ), last as (
        select distinct on (coalesce(group_id, id)) coalesce(group_id, id) g, name, roaster, origin, process, roast_level, buy_url, sca_score
        from coffees where household_id = p_household order by coalesce(group_id, id), created_at desc
      )
      select jsonb_agg(jsonb_build_object('name', l.name, 'roaster', l.roaster, 'origin', l.origin, 'process', l.process, 'roast', l.roast_level,
                                          'url', l.buy_url, 'sca', l.sca_score, 'stars', g.stars, 'n', g.n) order by g.stars desc, g.n desc)
      from (select * from g order by stars desc, n desc limit 5) g join last l on l.g = g.g), '[]'::jsonb));
  end if;

  -- taste profile: how the favourite brews taste (4 stars and up), the tasting notes in them, and everyone's usual drink
  if own or coalesce((sh ->> 'taste')::boolean, true) then
    res := res || jsonb_build_object('taste', (
      with rr as (
        select r.id, r.rating, r.rater_id, r.is_guest, r.drink, r.milk
        from brew_ratings r join brews b on b.id = r.brew_id join coffees c on c.id = b.coffee_id
        where c.household_id = p_household and not coalesce(b.is_dialin, false)
      ), sc as (
        select s.attribute a, s.score, rr.rating from brew_scores s join rr on rr.id = s.rating_id
      )
      select jsonb_build_object(
        'n_fav', (select count(*) from rr where rating >= 4),
        'n_all', (select count(*) from rr where rating is not null),
        'fav', (select jsonb_object_agg(a, v) from (select a, round(avg(score - 5), 2) v from sc where rating >= 4 and a in ('sour', 'sweet', 'bitter', 'balance') group by a) x),
        'all', (select jsonb_object_agg(a, v) from (select a, round(avg(score - 5), 2) v from sc where a in ('sour', 'sweet', 'bitter', 'balance') group by a) x),
        'notes', coalesce((select jsonb_agg(jsonb_build_object('note', a, 'n', n) order by n desc)
                  from (select a, count(*) n from sc where rating >= 4 and a not in ('sour', 'sweet', 'bitter', 'balance') and score >= 3 group by a order by count(*) desc limit 6) x), '[]'::jsonb),
        'drinks', coalesce((select jsonb_agg(jsonb_build_object('id', rater_id, 'drink', drink, 'milk', milk, 'n', n))
                   from (select distinct on (rater_id) rater_id, drink, milk, count(*) n from rr
                         where not is_guest and rater_id is not null and drink is not null
                         group by rater_id, drink, milk order by rater_id, count(*) desc) x), '[]'::jsonb)
      )));
  end if;
  return res;
end $$;

revoke execute on function public.friend_code(uuid), public.new_friend_code(uuid), public.friend_code_info(text), public.befriend(uuid, text),
  public.unfriend(uuid, uuid), public.my_friends(uuid), public.set_sharing(uuid, jsonb), public.household_stats(uuid, text), public.is_friend(uuid) from public, anon;
grant execute on function public.friend_code(uuid), public.new_friend_code(uuid), public.friend_code_info(text), public.befriend(uuid, text),
  public.unfriend(uuid, uuid), public.my_friends(uuid), public.set_sharing(uuid, jsonb), public.household_stats(uuid, text), public.is_friend(uuid) to authenticated;

commit;
