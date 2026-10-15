-- Who actually made a brew, when it is not the person who logged it.
-- Empty means: the person who logged it. Run once (after 09_names.sql). Safe to run again.
alter table brews add column if not exists made_by uuid references auth.users(id) on delete set null;
