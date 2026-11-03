-- Undo a merge of tasting notes (after 49_notes.sql): every merge is written down with what it changed (which bags,
-- which cups, the families), so "Undo past merges" in Trends can put it back.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

create table if not exists public.note_merges (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  from_note text not null, to_note text not null,
  bags uuid[] not null default '{}',        -- bags that had the old note only (it was renamed)
  bags_both uuid[] not null default '{}',   -- bags that had both (the old one was dropped)
  cups jsonb not null default '[]',         -- [{r: rating, b: brew, s: old score, t: score of the new note before, or null}]
  fam_from text, fam_to text,               -- the families before
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  undone_at timestamptz
);
create index if not exists note_merges_hh on public.note_merges(household_id, created_at desc);
alter table public.note_merges enable row level security;
revoke all on public.note_merges from anon, authenticated;
grant select on public.note_merges to authenticated;
drop policy if exists "household" on public.note_merges;
create policy "household" on public.note_merges for select to authenticated using (is_member(household_id));

create or replace function public.rename_note(p_household uuid, p_from text, p_to text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a text := lower(btrim(coalesce(p_from, ''))); b text := lower(btrim(coalesce(p_to, ''))); nb int := 0; nc int := 0;
  v_bags uuid[]; v_both uuid[]; v_cups jsonb; v_fa text; v_fb text; mid uuid;
begin
  if not is_member(p_household) then raise exception 'You are not in this household.'; end if;
  if a = '' or b = '' or a = b or char_length(b) > 60 then raise exception 'Pick two different notes.'; end if;
  if a in ('sour', 'sweet', 'bitter', 'body', 'balance') or b in ('sour', 'sweet', 'bitter', 'body', 'balance') then raise exception 'Sour, sweet, bitter, body and balance stay as they are.'; end if;
  -- what is there before, for the undo
  select coalesce(array_agg(id) filter (where not b = any(flavour_tags)), '{}'), coalesce(array_agg(id) filter (where b = any(flavour_tags)), '{}')
    into v_bags, v_both from coffees where household_id = p_household and a = any(flavour_tags);
  select coalesce(jsonb_agg(jsonb_build_object('r', s.rating_id, 'b', s.brew_id, 's', s.score,
           't', (select t.score from brew_scores t where t.rating_id = s.rating_id and t.attribute = b))), '[]')
    into v_cups from brew_scores s join brews w on w.id = s.brew_id join coffees c on c.id = w.coffee_id
    where s.attribute = a and c.household_id = p_household;
  select note_families ->> a, note_families ->> b into v_fa, v_fb from households where id = p_household;
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
  update households set note_families = case when note_families ? a and not note_families ? b then (note_families - a) || jsonb_build_object(b, note_families -> a) else note_families - a end
  where id = p_household;
  insert into note_merges (household_id, from_note, to_note, bags, bags_both, cups, fam_from, fam_to)
  values (p_household, a, b, v_bags, v_both, v_cups, v_fa, v_fb) returning id into mid;
  return jsonb_build_object('bags', nb, 'cups', nc, 'id', mid);
end $$;

-- put a merge back: the old note on its bags and cups again, the scores and the families as they were
create or replace function public.undo_note_merge(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m note_merges; x jsonb;
begin
  select * into m from note_merges where id = p_id;
  if m.id is null or not is_member(m.household_id) then raise exception 'This merge is not one you can undo.'; end if;
  if m.undone_at is not null then raise exception 'This merge was undone already.'; end if;
  -- the bags
  update coffees set flavour_tags = (select array_agg(distinct y order by y) from unnest(array_replace(flavour_tags, m.to_note, m.from_note)) y)
  where id = any(m.bags) and m.to_note = any(flavour_tags);
  update coffees set flavour_tags = (select array_agg(distinct y order by y) from unnest(flavour_tags || array[m.from_note]) y)
  where id = any(m.bags_both);
  -- the cups
  for x in select * from jsonb_array_elements(m.cups) loop
    if x ->> 't' is null then
      update brew_scores set attribute = m.from_note where rating_id = (x ->> 'r')::uuid and attribute = m.to_note;
    else
      update brew_scores set score = (x ->> 't')::smallint where rating_id = (x ->> 'r')::uuid and attribute = m.to_note;
      insert into brew_scores (brew_id, rating_id, attribute, score) values ((x ->> 'b')::uuid, (x ->> 'r')::uuid, m.from_note, (x ->> 's')::smallint)
      on conflict do nothing;
    end if;
  end loop;
  -- the families
  update households set note_families = (note_families - m.from_note - m.to_note)
      || case when m.fam_from is null then '{}'::jsonb else jsonb_build_object(m.from_note, m.fam_from) end
      || case when m.fam_to is null then '{}'::jsonb else jsonb_build_object(m.to_note, m.fam_to) end
  where id = m.household_id;
  update note_merges set undone_at = now() where id = p_id;
  return jsonb_build_object('note', m.from_note);
end $$;

revoke all on function public.rename_note(uuid, text, text), public.undo_note_merge(uuid) from public, anon;
grant execute on function public.rename_note(uuid, text, text), public.undo_note_merge(uuid) to authenticated;

commit;
