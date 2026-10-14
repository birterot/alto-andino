-- Stage 9: bags of the same coffee.
-- Every row in "coffees" is one bag. Bags of the same coffee share a group_id;
-- an empty group_id means the bag stands alone (all your existing coffees).
-- Run once in Supabase: SQL Editor, New query, paste, Run.
alter table coffees add column if not exists group_id uuid;
