-- Your data, your choice: delete your own account (Settings > Your data).
-- What goes: your login, your name and settings, your sleep answers, your notification phones, your feedback,
-- and every household you are the only member of (with its coffees, brews, ratings, cuppings and friends).
-- What stays: in households you share, the coffees and brews stay for the others, without your name
-- (your ratings there show as "Someone"). If you were its owner, the longest member becomes the owner.
-- The app removes the photos first (bag photos of the households that go, your feedback screenshots).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  -- shared households you own: the member who joined first after you becomes the owner
  update household_members m set role = 'owner'
  where m.user_id <> me and m.household_id in (select household_id from household_members where user_id = me and role = 'owner')
    and m.user_id = (select x.user_id from household_members x where x.household_id = m.household_id and x.user_id <> me order by x.joined_at limit 1)
    and not exists (select 1 from household_members o where o.household_id = m.household_id and o.user_id <> me and o.role = 'owner');
  -- households where you are the only member go with you
  delete from households h
  where exists (select 1 from household_members m where m.household_id = h.id and m.user_id = me)
    and not exists (select 1 from household_members m where m.household_id = h.id and m.user_id <> me);
  -- in shared households your coffees and brews stay, without your name
  update coffees set created_by = null where created_by = me;
  update brews set created_by = null where created_by = me;
  delete from feedback where user_id = me;
  begin update storage.objects set owner = null where owner = me; exception when others then null; end;   -- files never block it
  delete from auth.users where id = me;   -- your profile, settings, sleep answers and phones go with it
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- your own feedback screenshots can be removed by you (before, only added and read)
drop policy if exists "feedback own remove" on storage.objects;
create policy "feedback own remove" on storage.objects for delete to authenticated
  using (bucket_id = 'feedback' and split_part(name, '/', 1) = auth.uid()::text);

commit;
