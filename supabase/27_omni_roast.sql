-- "Omni" is not a roast level but a way of using a coffee (good for every way of brewing).
-- Coffees saved with the roast level "Omni" get all four "Suitable for" boxes ticked instead (espresso, filter, immersion, moka),
-- and their roast level is left empty, so you can pick light, medium-light, medium ... when you next edit them.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

update public.coffees
set suitable_for = array(select distinct x from unnest(coalesce(suitable_for, '{}') || array['espresso', 'filter', 'immersion', 'moka']) as x order by x),
    roast_level = null
where btrim(roast_level) ilike 'omni%';

commit;

-- To check: select name, roast_level, suitable_for from coffees order by created_at desc;
