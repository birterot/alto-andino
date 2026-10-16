-- Households: every coffee belongs to a household, and only its members can see it,
-- with its brews, scores and bag photos. Names are only visible to people you share a household with.
-- Your existing coffees go into one household, "Alto Andino", with everyone who has a login today as owner.
--
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.
-- It runs as one block: if anything fails, nothing is changed.

begin;

-- 1. Tables ------------------------------------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create table if not exists public.household_invites (
  code text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz
);
alter table public.coffees add column if not exists household_id uuid references public.households(id) on delete cascade;
create index if not exists coffees_household_idx on public.coffees(household_id);
create index if not exists household_members_user_idx on public.household_members(user_id);

-- 2. Helpers used by the access rules (they run with the rights of their owner, so they can look at memberships)
create or replace function public.is_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid())
$$;
create or replace function public.shares_household(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select uid = auth.uid() or exists (
    select 1 from household_members a join household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = uid)
$$;

-- 3. Actions the app calls (the only way to change households and memberships) ------------------------
create or replace function public.create_household(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  p_name := btrim(coalesce(p_name, ''));
  if p_name = '' then raise exception 'Please give the household a name.'; end if;
  insert into households (name, created_by) values (left(p_name, 60), auth.uid()) returning id into hid;
  insert into household_members (household_id, user_id, role) values (hid, auth.uid(), 'owner');
  return hid;
end $$;

create or replace function public.rename_household(p_household uuid, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  p_name := btrim(coalesce(p_name, ''));
  if p_name = '' then raise exception 'Please give the household a name.'; end if;
  update households set name = left(p_name, 60) where id = p_household;
end $$;

-- An invite is a code for one person, valid for 14 days.
create or replace function public.create_invite(p_household uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into household_invites (code, household_id, created_by) values (c, p_household, auth.uid());
  return c;
end $$;

create or replace function public.join_household(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv household_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into inv from household_invites where code = upper(btrim(coalesce(p_code, ''))) for update;
  if not found or inv.expires_at < now() then raise exception 'This invite is not valid or has expired.'; end if;
  if inv.used_by is not null and inv.used_by <> auth.uid() then raise exception 'This invite has already been used.'; end if;
  insert into household_members (household_id, user_id, role) values (inv.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;
  update household_invites set used_by = auth.uid(), used_at = coalesce(used_at, now()) where code = inv.code;
  return inv.household_id;
end $$;

create or replace function public.leave_household(p_household uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  if (select count(*) from household_members where household_id = p_household) <= 1 then
    raise exception 'You are the last member. Invite someone first, or keep the household.';
  end if;
  delete from household_members where household_id = p_household and user_id = auth.uid();
  if not exists (select 1 from household_members where household_id = p_household and role = 'owner') then
    update household_members set role = 'owner'
    where household_id = p_household and user_id = (select user_id from household_members where household_id = p_household order by joined_at limit 1);
  end if;
end $$;

create or replace function public.remove_member(p_household uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from household_members where household_id = p_household and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only an owner can remove someone.';
  end if;
  if p_user = auth.uid() then raise exception 'Use "Leave household" to remove yourself.'; end if;
  delete from household_members where household_id = p_household and user_id = p_user;
end $$;

revoke execute on function public.create_household(text), public.rename_household(uuid, text), public.create_invite(uuid),
  public.join_household(text), public.leave_household(uuid), public.remove_member(uuid, uuid) from public, anon;
grant execute on function public.create_household(text), public.rename_household(uuid, text), public.create_invite(uuid),
  public.join_household(text), public.leave_household(uuid), public.remove_member(uuid, uuid),
  public.is_member(uuid), public.shares_household(uuid) to authenticated;

-- 4. Move what exists today into one household ---------------------------------------------------------
do $$
declare hid uuid;
begin
  if exists (select 1 from coffees where household_id is null) then
    select id into hid from households order by created_at limit 1;
    if hid is null then
      insert into households (name, created_by) values ('Alto Andino', (select id from auth.users order by created_at limit 1)) returning id into hid;
      insert into household_members (household_id, user_id, role) select hid, id, 'owner' from auth.users on conflict do nothing;
    end if;
    update coffees set household_id = hid where household_id is null;
  end if;
end $$;

-- A new coffee goes into the person's household when the app does not say which.
create or replace function public.coffee_default_household() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.household_id is null then
    select household_id into new.household_id from household_members where user_id = auth.uid() order by joined_at limit 1;
  end if;
  return new;
end $$;
drop trigger if exists coffee_default_household on public.coffees;
create trigger coffee_default_household before insert on public.coffees for each row execute function public.coffee_default_household();
alter table public.coffees alter column household_id set not null;

-- 5. Access rules ------------------------------------------------------------------------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
grant select on public.households, public.household_members, public.household_invites to authenticated;
grant delete on public.household_invites to authenticated;

drop policy if exists "members read" on public.households;
create policy "members read" on public.households for select to authenticated using (public.is_member(id));
drop policy if exists "members read" on public.household_members;
create policy "members read" on public.household_members for select to authenticated using (public.is_member(household_id));
drop policy if exists "members read" on public.household_invites;
create policy "members read" on public.household_invites for select to authenticated using (public.is_member(household_id));
drop policy if exists "members delete" on public.household_invites;
create policy "members delete" on public.household_invites for delete to authenticated using (public.is_member(household_id));

-- coffees, brews and scores: only the household's members (this replaces "every signed-in person")
drop policy if exists "members all" on public.coffees;
drop policy if exists "household" on public.coffees;
create policy "household" on public.coffees for all to authenticated
  using (public.is_member(household_id)) with check (public.is_member(household_id));

drop policy if exists "members all" on public.brews;
drop policy if exists "household" on public.brews;
create policy "household" on public.brews for all to authenticated
  using (exists (select 1 from public.coffees c where c.id = brews.coffee_id and public.is_member(c.household_id)))
  with check (exists (select 1 from public.coffees c where c.id = brews.coffee_id and public.is_member(c.household_id)));

drop policy if exists "members all" on public.brew_scores;
drop policy if exists "household" on public.brew_scores;
create policy "household" on public.brew_scores for all to authenticated
  using (exists (select 1 from public.brews b join public.coffees c on c.id = b.coffee_id where b.id = brew_scores.brew_id and public.is_member(c.household_id)))
  with check (exists (select 1 from public.brews b join public.coffees c on c.id = b.coffee_id where b.id = brew_scores.brew_id and public.is_member(c.household_id)));

-- names: yourself and the people you share a household with
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (public.shares_household(id));

-- bag photos: files sit in a folder named after the person who uploaded them.
-- You can upload into your own folder, and see or remove photos of people you share a household with.
create or replace function public.photo_owner_ok(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f-]{36}$' then public.shares_household(split_part(path, '/', 1)::uuid) else false end
$$;
grant execute on function public.photo_owner_ok(text) to authenticated;
drop policy if exists "members photos" on storage.objects;
drop policy if exists "household photos read" on storage.objects;
drop policy if exists "household photos add" on storage.objects;
drop policy if exists "household photos remove" on storage.objects;
create policy "household photos read" on storage.objects for select to authenticated
  using (bucket_id = 'bag-photos' and public.photo_owner_ok(name));
create policy "household photos add" on storage.objects for insert to authenticated
  with check (bucket_id = 'bag-photos' and split_part(name, '/', 1) = auth.uid()::text);
create policy "household photos remove" on storage.objects for delete to authenticated
  using (bucket_id = 'bag-photos' and public.photo_owner_ok(name));

-- 6. A name typed at sign-up is used right away (otherwise the start of the email, as before)
create or replace function public.new_user_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Member'), 40))
  on conflict (id) do nothing;
  return new;
end $$;

commit;
