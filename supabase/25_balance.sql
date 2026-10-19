-- Balance: its own rating per brew and taster, from 0 (completely unbalanced) to 5 (exceptionally balanced).
-- It is not one of the sour / sweet / bitter sliders and is not worked out from them. Empty means "not rated" (never 0).
-- Old balance scores from the slider days (brew_scores, attribute 'balance', -5..+5) stay as they are and are still shown
-- on the brews they belong to, marked "old scale".
-- Also updates the friends' stats (supabase/23_friends.sql) so the taste profile shows the new Balance.
--
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.
-- It runs as one block: if anything fails, nothing is changed.

begin;

alter table public.brew_ratings add column if not exists balance smallint;
alter table public.brew_ratings drop constraint if exists brew_ratings_balance_check;
alter table public.brew_ratings add constraint brew_ratings_balance_check check (balance is null or balance between 0 and 5);

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
        select r.id, r.rating, r.balance, r.rater_id, r.is_guest, r.drink, r.milk
        from brew_ratings r join brews b on b.id = r.brew_id join coffees c on c.id = b.coffee_id
        where c.household_id = p_household and not coalesce(b.is_dialin, false)
      ), sc as (
        select s.attribute a, s.score, rr.rating from brew_scores s join rr on rr.id = s.rating_id
      )
      select jsonb_build_object(
        'n_fav', (select count(*) from rr where rating >= 4),
        'n_all', (select count(*) from rr where rating is not null),
        'fav', (select jsonb_object_agg(a, v) from (select a, round(avg(score - 5), 2) v from sc where rating >= 4 and a in ('sour', 'sweet', 'bitter') group by a) x),
        'all', (select jsonb_object_agg(a, v) from (select a, round(avg(score - 5), 2) v from sc where a in ('sour', 'sweet', 'bitter') group by a) x),
        -- Balance (0 to 5) is its own rating: the average of those who rated it, unrated ones left out
        'bal_fav', (select round(avg(balance), 2) from rr where rating >= 4 and balance is not null),
        'bal_fav_n', (select count(*) from rr where rating >= 4 and balance is not null),
        'bal_all', (select round(avg(balance), 2) from rr where balance is not null),
        'bal_all_n', (select count(*) from rr where balance is not null),
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

grant execute on function public.household_stats(uuid, text) to authenticated;

commit;
