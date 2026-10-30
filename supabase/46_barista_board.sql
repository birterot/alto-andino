-- Barista ranking on the Friends page (after 34_friends_more.sql): ranked by the typical cup (the median of
--   someone's brews of the last 90 days) instead of the plain average, so a few bad experiments don't pull
--   anyone down and brewing a lot doesn't count against you. The average stays as a tie-breaker, and the
--   best cup of the 90 days comes along for the little titles. At least 3 rated brews, as before.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

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
      select who, h, round(avg(s), 2) stars,
             round((percentile_cont(0.5) within group (order by s) filter (where s is not null))::numeric, 2) median,
             round(max(s), 2) best, count(s) n, count(*) brews
      from b where who is not null group by who, h having count(s) >= 3
    )
    select jsonb_agg(jsonb_build_object('id', p.who, 'name', coalesce(pr.display_name, 'Someone'), 'color', pr.prefs ->> 'color', 'photo', pr.photo_path,
                                        'household', p.h, 'household_name', hh.name, 'mine', p.h = p_household,
                                        'median', p.median, 'stars', p.stars, 'best', p.best, 'n', p.n, 'brews', p.brews)
                     order by p.median desc, p.stars desc, p.n desc)
    from p join households hh on hh.id = p.h left join profiles pr on pr.id = p.who
  ), '[]'::jsonb);
end $$;
revoke all on function public.barista_board(uuid) from public, anon;
grant execute on function public.barista_board(uuid) to authenticated;

commit;
