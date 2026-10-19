-- Your old balance scores (the slider from -5 to +5, saved with the other taste scores) become the new Balance (0 to 5):
-- the further right the slider was, the more balanced. -5 becomes 0, 0 becomes 3 (2.5 rounded up), +5 becomes 5,
-- in steps of half a point rounded to whole numbers: -4 and -3 → 1, -2 and -1 → 2, +1 → 3, +2 and +3 → 4, +4 → 5.
-- Each value goes to the same brew and the same taster. A Balance already given with the new buttons is not overwritten.
-- The old values stay saved as they were (nothing is deleted); the app just no longer shows them twice.
-- Needs supabase/25_balance.sql first. Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

update public.brew_ratings r
set balance = least(5, greatest(0, round(s.score::numeric / 2)))::smallint
from public.brew_scores s
where s.rating_id = r.id and s.attribute = 'balance' and s.score is not null and r.balance is null;

commit;

-- To see the result:  select balance, count(*) from brew_ratings group by 1 order by 1;
