-- Feedback from inside the app: anyone signed in can send it (with an optional screenshot),
-- only the app's admins read it and tick it off. Everyone can see what they sent themselves.
-- Admins to start with: the people in the first household (yours). Add more with:
--   insert into public.app_admins (user_id) select id from auth.users where email = 'name@example.com';
--
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.
-- It runs as one block: if anything fails, nothing is changed.

begin;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
insert into public.app_admins (user_id)
select user_id from public.household_members
where household_id = (select id from public.households order by created_at limit 1)
on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid())
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text check (char_length(name) <= 60),             -- so you know who it is (you cannot read other people's profiles)
  email text check (char_length(email) <= 200),          -- so you can write back
  kind text not null default 'idea' check (kind in ('bug', 'idea', 'confusing', 'praise')),
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  page text check (char_length(page) <= 300),            -- where in the app it was sent from
  device text check (char_length(device) <= 400),        -- phone, browser, screen size, home-screen app or not
  photo_path text check (char_length(photo_path) <= 300),
  done boolean not null default false,
  done_at timestamptz,
  note text check (char_length(note) <= 2000)            -- your own note on it
);
create index if not exists feedback_created_idx on public.feedback(created_at desc);

alter table public.feedback enable row level security;
alter table public.app_admins enable row level security;
revoke all on public.feedback, public.app_admins from anon;
grant select, insert, update on public.feedback to authenticated;
grant select on public.app_admins to authenticated;

drop policy if exists "send" on public.feedback;
create policy "send" on public.feedback for insert to authenticated
  with check (user_id = auth.uid() and done = false and done_at is null and note is null);
drop policy if exists "read" on public.feedback;
create policy "read" on public.feedback for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admins tick off" on public.feedback;
create policy "admins tick off" on public.feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "see yourself" on public.app_admins;
create policy "see yourself" on public.app_admins for select to authenticated using (user_id = auth.uid());

-- screenshots: a private folder per person; admins can look at all of them
insert into storage.buckets (id, name, public) values ('feedback', 'feedback', false) on conflict (id) do nothing;
drop policy if exists "feedback shots add" on storage.objects;
create policy "feedback shots add" on storage.objects for insert to authenticated
  with check (bucket_id = 'feedback' and split_part(name, '/', 1) = auth.uid()::text);
drop policy if exists "feedback shots read" on storage.objects;
create policy "feedback shots read" on storage.objects for select to authenticated
  using (bucket_id = 'feedback' and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin()));

commit;
