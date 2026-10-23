-- Notifications, part two: the person who made a brew hears when someone rates it ("Birte rated your coffee"),
-- and everyone chooses in Settings which notifications they want (saved in profiles.prefs.notify:
-- { "rate": false } = no "made you a coffee", { "rated": false } = no "rated your coffee"; nothing saved = both on).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 30_push.sql). Safe to run again.
-- Then update the Edge Function "notify" with the new code (Settings > Notifications > how to set it up).

begin;

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
  left join profiles pr on pr.id = r.rater_id
  where b.id = p_brew
    and coalesce(pr.prefs -> 'notify' ->> 'rate', 'true') <> 'false'
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
  left join profiles pm on pm.id = coalesce(b.made_by, b.created_by)
  where r.id = p_rating and not r.is_guest and r.rater_id = auth.uid()
    and coalesce(b.made_by, b.created_by) is not null and coalesce(b.made_by, b.created_by) <> auth.uid()
    and (r.rating is not null or r.balance is not null)
    and coalesce(pm.prefs -> 'notify' ->> 'rated', 'true') <> 'false'
$$;

revoke all on function public.push_targets(uuid) from public, anon;
revoke all on function public.push_rated_targets(uuid) from public, anon;
grant execute on function public.push_targets(uuid) to authenticated;
grant execute on function public.push_rated_targets(uuid) to authenticated;

commit;
