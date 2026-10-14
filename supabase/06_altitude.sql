-- Altitude of a coffee in metres above sea level.
-- Single value: only altitude_min_m is filled. Range: both are filled.
alter table coffees add column if not exists altitude_min_m integer;
alter table coffees add column if not exists altitude_max_m integer;
alter table coffees drop constraint if exists altitude_ok;
alter table coffees add constraint altitude_ok check (
  (altitude_min_m is null or (altitude_min_m between 0 and 5000))
  and (altitude_max_m is null or (altitude_max_m between 0 and 5000 and altitude_min_m is not null and altitude_max_m >= altitude_min_m))
);
