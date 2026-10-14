-- Stage 8: mark a brew as a dial-in brew. Dial-in brews stay in the history
-- but do not count toward the coffee's rating.
-- Run once in Supabase: SQL Editor, New query, paste, Run.
alter table brews add column if not exists is_dialin boolean not null default false;
