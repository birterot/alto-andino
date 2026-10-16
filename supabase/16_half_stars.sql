-- Half stars: a brew can be rated 0.5, 1, 1.5 ... 5. Existing whole-star ratings stay as they are.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table brews drop constraint if exists brews_rating_check;
alter table brews alter column rating type numeric(2,1);
alter table brews add constraint brews_rating_check check (rating is null or (rating between 0.5 and 5 and rating * 2 = trunc(rating * 2)));
