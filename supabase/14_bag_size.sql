-- Bag size in grams, so the app can show how much coffee is left.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table coffees add column if not exists bag_size_g integer check (bag_size_g is null or bag_size_g between 1 and 5000);
