-- Purchase date (when the roast date is unknown) and "finished" for a bag.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table coffees add column if not exists purchase_date date;
alter table coffees add column if not exists finished_at date;
