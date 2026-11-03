-- How a decaf was decaffeinated (Swiss Water, Mountain Water, sugarcane / EA, CO2, ...): asked on the Coffee Shelf
-- only when Decaf is ticked. Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

alter table public.coffees add column if not exists decaf_process text
  check (decaf_process is null or char_length(decaf_process) <= 60);
