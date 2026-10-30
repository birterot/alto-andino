-- What a bag cost (in euros), optional, per bag like the bag size. With the bag size the app works out the price per kg.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

alter table public.coffees add column if not exists price_eur numeric(7,2) check (price_eur is null or (price_eur >= 0 and price_eur <= 10000));
