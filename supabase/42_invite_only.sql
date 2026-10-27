-- Invite-only for now: someone who signs up without an invite waits until an admin says yes.
--   With a household invite link or a friend link they are in right away (a member vouched for them).
--   Everyone who already has an account is approved. Admins (app_admins) are always in.
--   Without a yes, nobody can start a household, so they cannot use the app (the database checks it, not only the screen).
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create table if not exists public.app_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check (status in ('approved', 'pending', 'declined')),
  via text check (via is null or via in ('existing', 'invite', 'friend', 'admin')),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);
alter table public.app_access enable row level security;
revoke all on public.app_access from anon, authenticated;   -- only through the functions below

-- everyone who is already here stays in
insert into public.app_access (user_id, status, via, decided_at)
select id, 'approved', 'existing', now() from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_approved(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_access where user_id = uid and status = 'approved')
      or exists (select 1 from app_admins where user_id = uid)
$$;
revoke all on function public.is_approved(uuid) from public, anon;
grant execute on function public.is_approved(uuid) to authenticated;

-- your status: approved, pending or declined. With a valid invite or friend code you are let in right away.
create or replace function public.access_status(p_code text default null) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); s text; c text := upper(btrim(coalesce(p_code, ''))); how text;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if is_approved(me) then return 'approved'; end if;
  select status into s from app_access where user_id = me;
  if c <> '' then
    if exists (select 1 from household_invites where code = c and expires_at > now() and (used_by is null or used_by = me)) then how := 'invite';
    elsif exists (select 1 from friend_invites where code = c and expires_at > now()) then how := 'friend';
    end if;
    if how is not null then
      insert into app_access (user_id, status, via, decided_at) values (me, 'approved', how, now())
      on conflict (user_id) do update set status = 'approved', via = how, decided_at = now();
      return 'approved';
    end if;
  end if;
  return coalesce(s, 'pending');
end $$;
revoke all on function public.access_status(text) from public, anon;
grant execute on function public.access_status(text) to authenticated;

-- a household can only be started by someone who is in
create or replace function public.households_need_access() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_approved(auth.uid()) then
    raise exception 'Your account is still waiting for approval. With an invite link you can join a household right away.';
  end if;
  return new;
end $$;
drop trigger if exists households_need_access on public.households;
create trigger households_need_access before insert on public.households for each row execute function public.households_need_access();

-- joining a household with an invite counts as a yes
create or replace function public.member_gets_access() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into app_access (user_id, status, via, decided_at) values (new.user_id, 'approved', 'invite', now())
  on conflict (user_id) do update set status = 'approved', via = coalesce(app_access.via, 'invite'), decided_at = now()
  where app_access.status <> 'approved';
  return new;
end $$;
drop trigger if exists member_gets_access on public.household_members;
create trigger member_gets_access after insert on public.household_members for each row execute function public.member_gets_access();

-- for the admins: who is waiting (and who was turned down), and the decision
create or replace function public.access_requests() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'Only for the app''s admins.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', u.id, 'name', p.display_name, 'email', u.email, 'signed_up', u.created_at,
      'status', coalesce(a.status, 'pending'), 'decided_at', a.decided_at) order by u.created_at desc)
    from auth.users u left join app_access a on a.user_id = u.id left join profiles p on p.id = u.id
    where coalesce(a.status, 'pending') <> 'approved'
      and not exists (select 1 from app_admins x where x.user_id = u.id)), '[]'::jsonb);
end $$;
revoke all on function public.access_requests() from public, anon;
grant execute on function public.access_requests() to authenticated;

create or replace function public.decide_access(p_user uuid, p_approve boolean) returns text
language plpgsql security definer set search_path = public as $$
declare s text := case when p_approve then 'approved' else 'declined' end;
begin
  if not exists (select 1 from app_admins where user_id = auth.uid()) then raise exception 'Only for the app''s admins.'; end if;
  if not exists (select 1 from auth.users where id = p_user) then raise exception 'This account does not exist any more.'; end if;
  insert into app_access (user_id, status, via, decided_at, decided_by) values (p_user, s, 'admin', now(), auth.uid())
  on conflict (user_id) do update set status = s, via = 'admin', decided_at = now(), decided_by = auth.uid();
  return s;
end $$;
revoke all on function public.decide_access(uuid, boolean) from public, anon;
grant execute on function public.decide_access(uuid, boolean) to authenticated;

commit;
