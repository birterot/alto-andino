-- When each person drank the brew, if not with the brew itself (iced coffee from the night before, say).
-- Empty = at the time of the brew. Only the caffeine estimate on Home uses it.
alter table public.brew_ratings add column if not exists drank_at timestamptz;
