-- Every new account waits for an admin's yes, also with an invite or a friend link (after 42_invite_only.sql).
--   Until then they can neither start nor join a household. An invite or friend link they came with is noted
--   on the Sign-up requests page ("invited to ..."), and the app joins them right after the yes.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

alter table public.app_access add column if not exists came_with text check (came_with is null or char_length(came_with) <= 200);

-- your status; a code you came with is only noted, it does not let you in any more
create or replace function public.access_status(p_code text default null) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); s text; c text := upper(btrim(coalesce(p_code, ''))); note text;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if is_approved(me) then return 'approved'; end if;
  select status into s from app_access where user_id = me;
  if c <> '' then
    select 'invited to ' || h.name into note from household_invites i join households h on h.id = i.household_id
      where i.code = c and i.expires_at > now() and (i.used_by is null or i.used_by = me);
    if note is null then
      select 'friend link from ' || h.name into note from friend_invites i join households h on h.id = i.household_id
        where i.code = c and i.expires_at > now();
    end if;
  end if;
  insert into app_access (user_id, status, came_with) values (me, coalesce(s, 'pending'), left(note, 200))
  on conflict (user_id) do update set came_with = coalesce(left(note, 200), app_access.came_with);
  return coalesce(s, 'pending');
end $$;
revoke all on function public.access_status(text) from public, anon;
grant execute on function public.access_status(text) to authenticated;

-- joining no longer counts as a yes; and nobody joins a household before the yes
drop trigger if exists member_gets_access on public.household_members;
create or replace function public.members_need_access() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.user_id = auth.uid() and not is_approved(auth.uid()) then
    raise exception 'Your account is still waiting for approval. You can join right after.';
  end if;
  return new;
end $$;
drop trigger if exists members_need_access on public.household_members;
create trigger members_need_access before insert on public.household_members for each row execute function public.members_need_access();

create or replace function public.households_need_access() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_approved(auth.uid()) then
    raise exception 'Your account is still waiting for approval. You can start right after.';
  end if;
  return new;
end $$;

-- the list for the admins: with what they came with
create or replace function public.access_requests() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'Only for the app''s admins.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', u.id, 'name', p.display_name, 'email', u.email, 'signed_up', u.created_at,
      'status', coalesce(a.status, 'pending'), 'decided_at', a.decided_at, 'came_with', a.came_with) order by u.created_at desc)
    from auth.users u left join app_access a on a.user_id = u.id left join profiles p on p.id = u.id
    where coalesce(a.status, 'pending') <> 'approved'
      and not exists (select 1 from app_admins x where x.user_id = u.id)), '[]'::jsonb);
end $$;

commit;
