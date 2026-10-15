-- Flair preheat setting per brew (low / medium / high), and the grinder's correct name.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table brews add column if not exists preheat text;
update brews set grinder = 'Kingrinder K6' where grinder = '1Zpresso K6';
