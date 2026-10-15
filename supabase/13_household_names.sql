-- Everyone with a login gets a name entry straight away (the part of their email before the @),
-- so they can be picked as "Made by" before they ever open the journal. They can change it later.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.

-- 1. Everyone who already has a login
insert into public.profiles (id, display_name)
select id, left(coalesce(nullif(split_part(email, '@', 1), ''), 'Member'), 40) from auth.users
on conflict (id) do nothing;

-- 2. Everyone who gets a login in the future
create or replace function public.new_user_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'Member'), 40))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
  for each row execute function public.new_user_profile();
