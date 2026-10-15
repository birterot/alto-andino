-- Grinder, feel word, water, temperature and pressure profile for brews; "suitable for" for coffees.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
alter table brews add column if not exists grinder text;
alter table brews add column if not exists grind_feel text;
alter table brews add column if not exists water_g numeric;
alter table brews add column if not exists temp_c numeric;
alter table brews add column if not exists pressure_profile jsonb;
alter table coffees add column if not exists suitable_for text[] not null default '{}';
