-- What each taster drank (espresso, flat white, cappuccino ...) and with which milk,
-- and personal settings (default device, grinder, drinks, milk, form mode) stored with your name.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run (after 19_brew_ratings.sql). Safe to run again.

begin;

alter table public.brew_ratings add column if not exists drink text check (drink is null or char_length(drink) <= 40);
alter table public.brew_ratings add column if not exists milk text check (milk is null or char_length(milk) <= 40);

-- settings as a small JSON object, e.g. {"device": "Flair 58", "drink_esp": "flat_white", "milk": "oat"}.
-- Readable by the people you share a household with (so their default drink is filled in when you add them as taster),
-- changeable only by yourself (the existing "profiles update own" rule).
alter table public.profiles add column if not exists prefs jsonb not null default '{}'::jsonb;

commit;
