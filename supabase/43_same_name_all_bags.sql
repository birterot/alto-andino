-- One coffee, one name: bags of a coffee that was renamed before (only its newest bag got the new name)
-- all get the name and roaster of their newest bag, so the coffee's history stays together (Trends, the shelf).
-- From now on the app renames all bags at once. Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

update public.coffees c
set name = n.name, roaster = n.roaster
from (
  select distinct on (coalesce(group_id, id)) coalesce(group_id, id) as k, name, roaster
  from public.coffees
  order by coalesce(group_id, id), created_at desc
) n
where coalesce(c.group_id, c.id) = n.k
  and (c.name is distinct from n.name or c.roaster is distinct from n.roaster);
