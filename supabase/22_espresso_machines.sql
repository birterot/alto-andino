-- "Flair 58" becomes "Manual espresso machine" (and there is now also "Semi-automatic espresso machine").
-- This renames the device on your existing brews, in their automatic recipe names, and in Settings,
-- so filters and charts keep them together with the new brews.
-- Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

update public.brews set device = 'Manual espresso machine' where device in ('Flair 58', 'Flair');
update public.brews set recipe = 'Manual espresso machine' || substr(recipe, length('Flair 58') + 1) where recipe like 'Flair 58%';
update public.profiles set prefs = jsonb_set(prefs, '{device}', '"Manual espresso machine"') where prefs->>'device' in ('Flair 58', 'Flair');

commit;
