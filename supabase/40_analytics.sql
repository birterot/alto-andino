-- Analytics: how much the app is used, for the app's admins only (the menu shows "Analytics" to them).
--   1. From what is already there: accounts, brews, ratings, coffees, cuppings, per week and per person.
--   2. Which parts of the app are opened: each page counts once a day per phone, with who opened it
--      (or no one, when signed out). Kept for 400 days, gone with the account, and part of "Delete some of my data".
-- Admins are the ones in app_admins (from 24_feedback.sql: the people in the first household).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create table if not exists public.app_usage (
  day date not null,
  page text not null check (page ~ '^[a-z0-9/_-]{1,40}$'),
  user_id uuid references auth.users(id) on delete cascade,   -- empty: someone signed out (the book pages)
  opens int not null default 1
);
create unique index if not exists app_usage_key on public.app_usage(day, page, user_id) nulls not distinct;
create index if not exists app_usage_user_idx on public.app_usage(user_id);
alter table public.app_usage enable row level security;
revoke all on public.app_usage from anon, authenticated;
grant select on public.app_usage to authenticated;   -- your own lines only (for "your data")
drop policy if exists "own" on public.app_usage;
create policy "own" on public.app_usage for select to authenticated using (user_id = auth.uid());

-- the app sends the pages opened on this phone today (once each); the answer says whether you are an admin
create or replace function public.log_visits(p_pages text[]) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); pg text; d date := (now() at time zone 'Europe/Berlin')::date;
begin
  foreach pg in array coalesce(p_pages[1:20], '{}') loop
    if pg ~ '^[a-z0-9/_-]{1,40}$' then
      insert into app_usage (day, page, user_id) values (d, pg, me)
      on conflict (day, page, user_id) do update set opens = least(app_usage.opens + 1, 10000);
    end if;
  end loop;
  delete from app_usage where day < d - 400;
  return me is not null and exists (select 1 from app_admins where user_id = me);
end $$;
revoke all on function public.log_visits(text[]) from public;
grant execute on function public.log_visits(text[]) to anon, authenticated;

-- everything for the Analytics page, over the last p_weeks weeks (Monday to Sunday, Berlin time)
create or replace function public.usage_report(p_weeks int default 12) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  w int := least(greatest(coalesce(p_weeks, 12), 1), 104);
  today date := (now() at time zone 'Europe/Berlin')::date;
  w0 date := date_trunc('week', today)::date - (w - 1) * 7;   -- the Monday of the first week
  res jsonb;
begin
  if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'Only for the app''s admins.'; end if;
  with
  -- every day someone did something: opened a page, made a brew, rated, added a coffee, cupped
  act as (
    select user_id as uid, day from app_usage where user_id is not null and day >= w0
    union select coalesce(made_by, created_by), (brewed_at at time zone 'Europe/Berlin')::date from brews where brewed_at >= w0
    union select rater_id, (created_at at time zone 'Europe/Berlin')::date from brew_ratings where rater_id is not null and not is_guest and created_at >= w0
    union select created_by, (created_at at time zone 'Europe/Berlin')::date from coffees where created_by is not null and created_at >= w0
    union select cupper_id, (cupped_at at time zone 'Europe/Berlin')::date from cuppings where cupper_id is not null and not coalesce(is_guest, false) and cupped_at >= w0
  ),
  weeks as (select generate_series(w0, date_trunc('week', today)::date, interval '7 days')::date as wk),
  per_week as (
    select x.wk,
      (select count(distinct uid) from act where day >= x.wk and day < x.wk + 7) as active,
      (select count(*) from brews where (brewed_at at time zone 'Europe/Berlin')::date >= x.wk and (brewed_at at time zone 'Europe/Berlin')::date < x.wk + 7) as brews,
      (select count(*) from brew_ratings where (created_at at time zone 'Europe/Berlin')::date >= x.wk and (created_at at time zone 'Europe/Berlin')::date < x.wk + 7) as ratings,
      (select count(*) from coffees where (created_at at time zone 'Europe/Berlin')::date >= x.wk and (created_at at time zone 'Europe/Berlin')::date < x.wk + 7) as coffees,
      (select count(*) from auth.users where (created_at at time zone 'Europe/Berlin')::date >= x.wk and (created_at at time zone 'Europe/Berlin')::date < x.wk + 7) as signups,
      (select coalesce(sum(opens), 0) from app_usage where day >= x.wk and day < x.wk + 7) as opens,
      (select coalesce(sum(opens), 0) from app_usage where user_id is null and day >= x.wk and day < x.wk + 7) as visitors
    from weeks x
  )
  select jsonb_build_object(
    'from', w0, 'today', today,
    'logged_since', (select min(day) from app_usage),
    'totals', jsonb_build_object(
      'accounts', (select count(*) from auth.users),
      'households', (select count(*) from households),
      'friendships', (select count(*) from friendships),
      'active7', (select count(distinct uid) from act where day > today - 7),
      'active30', (select count(distinct uid) from act where day > today - 30),
      'brews', (select count(*) from brews),
      'ratings', (select count(*) from brew_ratings),
      'coffees', (select count(*) from coffees),
      'cuppings', (select count(*) from cuppings),
      'phones', (select count(*) from push_subscriptions),
      'feedback_open', (select count(*) from feedback where not done)),
    'weeks', (select coalesce(jsonb_agg(to_jsonb(pw) order by pw.wk), '[]'::jsonb) from per_week pw),
    'people', (select coalesce(jsonb_agg(p order by p->>'last' desc nulls last), '[]'::jsonb) from (
      select jsonb_build_object(
        'id', u.id, 'name', coalesce(pr.display_name, split_part(u.email, '@', 1)), 'photo', pr.photo_path,
        'joined', (u.created_at at time zone 'Europe/Berlin')::date,
        'household', (select string_agg(h.name, ', ') from household_members m join households h on h.id = m.household_id where m.user_id = u.id),
        'last', greatest((select max(day) from app_usage where user_id = u.id),
                         (select max((brewed_at at time zone 'Europe/Berlin')::date) from brews where coalesce(made_by, created_by) = u.id),
                         (select max((created_at at time zone 'Europe/Berlin')::date) from brew_ratings where rater_id = u.id and not is_guest)),
        'days30', (select count(distinct day) from act where uid = u.id and day > today - 30),
        'brews', (select count(*) from brews where coalesce(made_by, created_by) = u.id and brewed_at >= w0),
        'ratings', (select count(*) from brew_ratings where rater_id = u.id and not is_guest and created_at >= w0)) as p
      from auth.users u left join profiles pr on pr.id = u.id
      limit 500) q),
    'pages', (select coalesce(jsonb_agg(jsonb_build_object('page', page, 'opens', o, 'people', n, 'visitors', v) order by o desc), '[]'::jsonb) from (
      select page, sum(opens) as o, count(distinct user_id) as n, coalesce(sum(opens) filter (where user_id is null), 0) as v
      from app_usage where day >= w0 group by page) g),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('device', device, 'brews', n) order by n desc), '[]'::jsonb) from (
      select coalesce(device, 'Not set') as device, count(*) as n from brews where brewed_at >= w0 group by 1 order by 2 desc limit 12) d)
  ) into res;
  return res;
end $$;
revoke all on function public.usage_report(int) from public, anon;
grant execute on function public.usage_report(int) to authenticated;

-- "Delete some of my data" (36_delete_my_data.sql) now also has: usage (which pages you opened)
create or replace function public.delete_my_data(p_what text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); res jsonb := '{}'::jsonb; n int; touched uuid[];
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_what is null or cardinality(p_what) = 0 then return res; end if;
  if 'brews' = any(p_what) then
    delete from brews where coalesce(made_by, created_by) = me; get diagnostics n = row_count; res := res || jsonb_build_object('brews', n);
  end if;
  if 'coffees' = any(p_what) then
    delete from coffees where created_by = me; get diagnostics n = row_count; res := res || jsonb_build_object('coffees', n);
  end if;
  if 'ratings' = any(p_what) then
    select array_agg(distinct brew_id) into touched from brew_ratings where rater_id = me and not is_guest;
    delete from brew_ratings where rater_id = me and not is_guest; get diagnostics n = row_count; res := res || jsonb_build_object('ratings', n);
    update brews b set rating = (select round(avg(r.rating) * 2) / 2 from brew_ratings r where r.brew_id = b.id and r.rating is not null)
    where b.id = any(coalesce(touched, '{}'));
  end if;
  if 'cuppings' = any(p_what) then
    delete from cuppings where cupper_id = me and not coalesce(is_guest, false); get diagnostics n = row_count; res := res || jsonb_build_object('cuppings', n);
  end if;
  if 'sleep' = any(p_what) then
    delete from sleep_logs where user_id = me; get diagnostics n = row_count; res := res || jsonb_build_object('sleep', n);
  end if;
  if 'feedback' = any(p_what) then
    delete from feedback where user_id = me; get diagnostics n = row_count; res := res || jsonb_build_object('feedback', n);
  end if;
  if 'phones' = any(p_what) then
    delete from push_subscriptions where user_id = me; get diagnostics n = row_count; res := res || jsonb_build_object('phones', n);
  end if;
  if 'usage' = any(p_what) then
    delete from app_usage where user_id = me; get diagnostics n = row_count; res := res || jsonb_build_object('usage', n);
  end if;
  if 'profile' = any(p_what) then
    update profiles set photo_path = null, about = null where id = me; res := res || jsonb_build_object('profile', 1);
  end if;
  if 'settings' = any(p_what) then
    update profiles set prefs = '{}'::jsonb where id = me; res := res || jsonb_build_object('settings', 1);
  end if;
  return res;
end $$;
revoke all on function public.delete_my_data(text[]) from public, anon;
grant execute on function public.delete_my_data(text[]) to authenticated;

commit;
