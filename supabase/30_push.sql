-- Notifications (web push) on the phones that turned them on in Settings.
-- One row per phone: where to send it (endpoint) and its keys. Nobody reads other people's rows directly;
-- the sender (Edge Function "notify") asks push_targets() for the people a brew is for.
--
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create table if not exists public.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) <= 1000),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
grant select, delete on public.push_subscriptions to authenticated;
drop policy if exists "own" on public.push_subscriptions;
create policy "own" on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- this phone, for you (a phone that was someone else's before is taken over)
create or replace function public.push_save(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from push_subscriptions where endpoint = p_endpoint;
  insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (p_endpoint, auth.uid(), p_p256dh, p_auth);
end $$;

-- turned off, or the push service says the phone is gone: yours, or someone's in your household
create or replace function public.push_remove(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and shares_household(user_id)
$$;

-- who to tell about a brew: the people it is for who have not rated it yet (not you), on each of their phones,
-- with what the message needs. Only for brews of your own household.
create or replace function public.push_targets(p_brew uuid)
returns table (endpoint text, p256dh text, auth text, rating_id uuid, coffee_id uuid, coffee_name text, device text, maker text)
language sql stable security definer set search_path = public as $$
  select s.endpoint, s.p256dh, s.auth, r.id, c.id, c.name, b.device, coalesce(p.display_name, 'Someone')
  from brews b
  join coffees c on c.id = b.coffee_id and is_member(c.household_id)
  join brew_ratings r on r.brew_id = b.id and not r.is_guest and r.rater_id is not null and r.rater_id <> auth.uid() and r.rating is null and r.balance is null
  join push_subscriptions s on s.user_id = r.rater_id
  left join profiles p on p.id = coalesce(b.made_by, b.created_by)
  where b.id = p_brew
$$;

revoke all on function public.push_save(text, text, text) from public, anon;
revoke all on function public.push_remove(text) from public, anon;
revoke all on function public.push_targets(uuid) from public, anon;
grant execute on function public.push_save(text, text, text) to authenticated;
grant execute on function public.push_remove(text) to authenticated;
grant execute on function public.push_targets(uuid) to authenticated;

commit;
