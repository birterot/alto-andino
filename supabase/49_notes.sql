-- Tasting notes, tidied up (the flavour wheel in Trends):
--   1. note_families: the family a household gave a note of its own ("earl grey" -> Floral, "juicy" -> "-" for no family).
--   2. rename_note: one note becomes another ("blue berry" -> "blueberry") on every bag and every rated cup of the household,
--      so two spellings count as one. Merging into a note a cup already has keeps the stronger of the two.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

alter table public.households add column if not exists note_families jsonb not null default '{}'::jsonb;

create or replace function public.set_note_family(p_household uuid, p_note text, p_family text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n text := lower(btrim(coalesce(p_note, ''))); f text := btrim(coalesce(p_family, '')); res jsonb;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  if n = '' or char_length(n) > 60 or char_length(f) > 40 then raise exception 'Not a note.'; end if;
  update households set note_families = case when f = '' then note_families - n else note_families || jsonb_build_object(n, f) end
  where id = p_household returning note_families into res;
  return res;
end $$;

create or replace function public.rename_note(p_household uuid, p_from text, p_to text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := lower(btrim(coalesce(p_from, ''))); b text := lower(btrim(coalesce(p_to, ''))); nb int := 0; nc int := 0;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  if a = '' or b = '' or a = b or char_length(b) > 60 then raise exception 'Pick two different notes.'; end if;
  if a in ('sour', 'sweet', 'bitter', 'body', 'balance') or b in ('sour', 'sweet', 'bitter', 'body', 'balance') then raise exception 'Sour, sweet, bitter, body and balance stay as they are.'; end if;
  -- the bags: the old name out, the new one in (once)
  update coffees c set flavour_tags = (select array_agg(distinct x order by x) from unnest(array_replace(c.flavour_tags, a, b)) x)
  where c.household_id = p_household and a = any(c.flavour_tags);
  get diagnostics nb = row_count;
  -- the cups: where the cup already has the new note, keep the stronger one; otherwise rename it
  update brew_scores t set score = greatest(t.score, s.score)
  from brew_scores s, brews w, coffees c
  where s.attribute = a and t.attribute = b and t.rating_id = s.rating_id and w.id = s.brew_id and c.id = w.coffee_id and c.household_id = p_household;
  delete from brew_scores s using brews w, coffees c
  where s.attribute = a and w.id = s.brew_id and c.id = w.coffee_id and c.household_id = p_household
    and exists (select 1 from brew_scores t where t.rating_id = s.rating_id and t.attribute = b);
  update brew_scores s set attribute = b from brews w, coffees c
  where s.attribute = a and w.id = s.brew_id and c.id = w.coffee_id and c.household_id = p_household;
  get diagnostics nc = row_count;
  -- its family goes with it, unless the new one has its own
  update households set note_families = case when note_families ? a and not note_families ? b then (note_families - a) || jsonb_build_object(b, note_families -> a) else note_families - a end
  where id = p_household;
  return jsonb_build_object('bags', nb, 'cups', nc);
end $$;

revoke all on function public.set_note_family(uuid, text, text), public.rename_note(uuid, text, text) from public, anon;
grant execute on function public.set_note_family(uuid, text, text), public.rename_note(uuid, text, text) to authenticated;

commit;
