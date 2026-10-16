-- Decaf: marks a coffee as decaffeinated (for a caffeine counter later).
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table coffees add column if not exists is_decaf boolean not null default false;
