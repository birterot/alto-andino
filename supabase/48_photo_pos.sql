-- How a coffee's bag photo sits in its frame on the card: "x y zoom" (the middle of what shows, in %, and how far in),
-- chosen by dragging the photo when editing the coffee. Run once in Supabase: SQL Editor > New query > paste everything > Run.
-- Safe to run again.

alter table public.coffees add column if not exists photo_pos text
  check (photo_pos is null or photo_pos ~ '^\d{1,3}(\.\d+)? \d{1,3}(\.\d+)? \d(\.\d+)?$');
