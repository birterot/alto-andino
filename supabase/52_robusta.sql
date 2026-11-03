-- The Robusta share of a blend of Arabica and Robusta, as the bag says (e.g. 20 for "80% Arabica, 20% Robusta").
-- Used for the caffeine (Robusta has about twice as much) and in Trends. Empty: not on the bag.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

alter table public.coffees add column if not exists robusta_pct smallint
  check (robusta_pct is null or robusta_pct between 0 and 100);
