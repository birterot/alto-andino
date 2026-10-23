-- Notifications, part two: more kinds, and everyone chooses in Settings which ones they want.
--   rate       someone made you a coffee to rate                     (on unless switched off)
--   rated      someone rated a coffee you made                       (on)
--   hhbrew     someone in your household logged a brew               (off unless switched on)
--   coffee     a coffee was added, a bag bought, opened or finished  (on)
--   household  someone joined or left, the name or sharing changed   (on)
--   friend     a household became your friend                        (on)
--   friendbrew a friend brewed a coffee they share                   (off)
-- The choices are saved in profiles.prefs.notify, e.g. { "rated": false, "hhbrew": true }.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 30_push.sql). Safe to run again.
-- Then update the Edge Function "notify" with the new code (Settings > Notifications > how to set it up).

begin;

-- does this person want this kind? (their choice, else the default)
create or replace function public.notify_on(p_user uuid, p_kind text, p_default boolean) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (prefs -> 'notify' ->> p_kind)::boolean from profiles where id = p_user), p_default)
$$;

-- who to tell about a brew to rate: as before, but only people who still want these
create or replace function public.push_targets(p_brew uuid)
returns table (endpoint text, p256dh text, auth text, rating_id uuid, coffee_id uuid, coffee_name text, device text, maker text)
language sql stable security definer set search_path = public as $$
  select s.endpoint, s.p256dh, s.auth, r.id, c.id, c.name, b.device, coalesce(p.display_name, 'Someone')
  from brews b
  join coffees c on c.id = b.coffee_id and is_member(c.household_id)
  join brew_ratings r on r.brew_id = b.id and not r.is_guest and r.rater_id is not null and r.rater_id <> auth.uid() and r.rating is null and r.balance is null
  join push_subscriptions s on s.user_id = r.rater_id
  left join profiles p on p.id = coalesce(b.made_by, b.created_by)
  where b.id = p_brew and notify_on(r.rater_id, 'rate', true)
$$;

-- who to tell that a cup was rated: the person who made the brew (on each of their phones), if it was not them.
-- Only for your own rating (you cannot announce someone else's), at home or at a friend's.
create or replace function public.push_rated_targets(p_rating uuid)
returns table (endpoint text, p256dh text, auth text, brew_id uuid, coffee_id uuid, coffee_name text, device text, rater text, rating numeric, balance smallint, drink text, milk text)
language sql stable security definer set search_path = public as $$
  select s.endpoint, s.p256dh, s.auth, b.id, c.id, c.name, b.device, coalesce(pr.display_name, 'Someone'), r.rating, r.balance, r.drink, r.milk
  from brew_ratings r
  join brews b on b.id = r.brew_id
  join coffees c on c.id = b.coffee_id
  join push_subscriptions s on s.user_id = coalesce(b.made_by, b.created_by)
  left join profiles pr on pr.id = r.rater_id
  where r.id = p_rating and not r.is_guest and r.rater_id = auth.uid()
    and coalesce(b.made_by, b.created_by) is not null and coalesce(b.made_by, b.created_by) <> auth.uid()
    and (r.rating is not null or r.balance is not null)
    and notify_on(coalesce(b.made_by, b.created_by), 'rated', true)
$$;

-- who to tell about something that happened (you did it, so you can announce it; you never hear about your own doing):
--   hhbrew / friendbrew: p_ref = a brew you logged         coffee: p_ref = a coffee of your household, p_what = added, bag, opened, finished
--   household: p_ref = your household, p_what = joined, left (asked before leaving), renamed, sharing, until
--   friend: p_ref = the household you just became friends with
-- Each row: one phone, and what the message needs.
create or replace function public.push_event_targets(p_kind text, p_ref uuid, p_what text default null)
returns table (endpoint text, p256dh text, auth text, actor text, place text, item text, extra text, coffee_id uuid, brew_id uuid, household_id uuid)
language plpgsql stable security definer set search_path = public as $$
declare me_name text := coalesce((select display_name from profiles where id = auth.uid()), 'Someone');
begin
  if auth.uid() is null then return; end if;
  if p_kind in ('hhbrew', 'friendbrew') then
    return query
      select distinct on (s.endpoint) s.endpoint, s.p256dh, s.auth, coalesce(pm.display_name, me_name), h.name, c.name, b.device, c.id, b.id, h.id
      from brews b
      join coffees c on c.id = b.coffee_id and is_member(c.household_id)
      join households h on h.id = c.household_id
      left join profiles pm on pm.id = coalesce(b.made_by, b.created_by)
      join household_members m on (
        (p_kind = 'hhbrew' and m.household_id = c.household_id)
        or (p_kind = 'friendbrew' and shares_coffees(c.household_id) and not c.friends_hidden and m.household_id in (
          select case when f.a = c.household_id then f.b else f.a end from friendships f where f.a = c.household_id or f.b = c.household_id)))
      join push_subscriptions s on s.user_id = m.user_id
      where b.id = p_ref and b.created_by = auth.uid()
        and m.user_id <> auth.uid() and (m.until is null or m.until > now())
        and not exists (select 1 from brew_ratings r where r.brew_id = b.id and r.rater_id = m.user_id)   -- tasters already hear "made you a coffee"
        and (p_kind = 'hhbrew' or not exists (select 1 from household_members x where x.household_id = c.household_id and x.user_id = m.user_id))
        and notify_on(m.user_id, p_kind, false);
  elsif p_kind = 'coffee' and p_what in ('added', 'bag', 'opened', 'finished') then
    return query
      select distinct on (s.endpoint) s.endpoint, s.p256dh, s.auth, me_name, h.name, c.name, p_what, c.id, null::uuid, h.id
      from coffees c
      join households h on h.id = c.household_id
      join household_members m on m.household_id = c.household_id
      join push_subscriptions s on s.user_id = m.user_id
      where c.id = p_ref and is_member(c.household_id)
        and m.user_id <> auth.uid() and (m.until is null or m.until > now())
        and notify_on(m.user_id, 'coffee', true);
  elsif p_kind = 'household' and p_what in ('joined', 'left', 'renamed', 'sharing', 'until') then
    return query
      select distinct on (s.endpoint) s.endpoint, s.p256dh, s.auth, me_name, h.name, null::text, p_what, null::uuid, null::uuid, h.id
      from households h
      join household_members m on m.household_id = h.id
      join push_subscriptions s on s.user_id = m.user_id
      where h.id = p_ref and is_member(h.id)
        and m.user_id <> auth.uid() and (m.until is null or m.until > now())
        and notify_on(m.user_id, 'household', true);
  elsif p_kind = 'friend' then
    return query
      select distinct on (s.endpoint) s.endpoint, s.p256dh, s.auth, me_name, mine.name, null::text, null::text, null::uuid, null::uuid, mine.id
      from friendships f
      join households mine on mine.id = case when f.a = p_ref then f.b else f.a end and is_member(mine.id)
      join household_members m on m.household_id = p_ref
      join push_subscriptions s on s.user_id = m.user_id
      where (f.a = p_ref or f.b = p_ref)
        and m.user_id <> auth.uid() and (m.until is null or m.until > now())
        and notify_on(m.user_id, 'friend', true);
  end if;
end $$;

revoke all on function public.notify_on(uuid, text, boolean) from public, anon;
revoke all on function public.push_event_targets(text, uuid, text) from public, anon;
grant execute on function public.push_event_targets(text, uuid, text) to authenticated;
revoke all on function public.push_targets(uuid) from public, anon;
revoke all on function public.push_rated_targets(uuid) from public, anon;
grant execute on function public.push_targets(uuid) to authenticated;
grant execute on function public.push_rated_targets(uuid) to authenticated;

commit;
