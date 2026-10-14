-- Stage 7: buy link per coffee, overall star rating per brew.
-- Run once in Supabase: SQL Editor, New query, paste, Run.
alter table coffees add column if not exists buy_url text;
alter table brews add column if not exists rating smallint check (rating between 1 and 5);
