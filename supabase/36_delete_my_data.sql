-- Your data, your choice, part two: delete parts of your data and keep your account (Settings > Account > Your data).
-- You tick what goes; your login, your name and your households stay. Returns how much was deleted of each.
--   ratings    your stars, Balance and tasting notes on brews (the brews' average stars are worked out again)
--   sleep      your sleep answers
--   brews      the brews you made, with everyone's ratings of them (also for the others in your household)
--   coffees    the coffees you added, with all their brews (also for the others in your household)
--   cuppings   your cupping scores
--   feedback   what you sent with Feedback
--   profile    your photo and the line about you
--   settings   your settings (name stays)
--   phones     the phones that get your notifications
-- The app removes the photo files first (bag photos of the coffees that go, your profile photo, feedback screenshots).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

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
    -- the brews' own stars stay the average of whoever is left
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
