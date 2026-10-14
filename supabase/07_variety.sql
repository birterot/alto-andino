-- Botanical variety (free text, e.g. "Gesha" or "Bourbon, Caturra").
alter table coffees add column if not exists variety text;
