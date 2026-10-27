-- Bloom time for pour-over brews: how long the first pour sat before the next one, in seconds.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

alter table public.brews add column if not exists bloom_s numeric check (bloom_s is null or (bloom_s >= 0 and bloom_s <= 600));
