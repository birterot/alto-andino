-- Archive a bag: it disappears from the coffee list, but its brews stay in the history and in Trends.
-- Archived bags can be restored. Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table coffees add column if not exists archived boolean not null default false;
