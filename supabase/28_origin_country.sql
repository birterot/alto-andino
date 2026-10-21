-- Origins in one shape: "Country, Region", the country first and in one spelling ("Huila, Colombia" and "Kolumbien, Huila"
-- both become "Colombia, Huila"; "Sumatra" becomes "Indonesia, Sumatra"). The app now has a Country and a Region field and
-- saves them this way, and the stats group by country. Origins without a known country, and blends of several countries,
-- stay exactly as they are. Run once in Supabase: SQL Editor > New query > paste everything > Run. Safe to run again.

begin;

with origin_names (name, country, regional) as (values
  ('bolivia', 'Bolivia', false),
  ('brazil', 'Brazil', false),
  ('burundi', 'Burundi', false),
  ('china', 'China', false),
  ('colombia', 'Colombia', false),
  ('costa rica', 'Costa Rica', false),
  ('cuba', 'Cuba', false),
  ('dr congo', 'DR Congo', false),
  ('dominican republic', 'Dominican Republic', false),
  ('ecuador', 'Ecuador', false),
  ('el salvador', 'El Salvador', false),
  ('ethiopia', 'Ethiopia', false),
  ('guatemala', 'Guatemala', false),
  ('haiti', 'Haiti', false),
  ('honduras', 'Honduras', false),
  ('india', 'India', false),
  ('indonesia', 'Indonesia', false),
  ('jamaica', 'Jamaica', false),
  ('kenya', 'Kenya', false),
  ('laos', 'Laos', false),
  ('malawi', 'Malawi', false),
  ('mexico', 'Mexico', false),
  ('myanmar', 'Myanmar', false),
  ('nepal', 'Nepal', false),
  ('nicaragua', 'Nicaragua', false),
  ('panama', 'Panama', false),
  ('papua new guinea', 'Papua New Guinea', false),
  ('peru', 'Peru', false),
  ('philippines', 'Philippines', false),
  ('puerto rico', 'Puerto Rico', false),
  ('rwanda', 'Rwanda', false),
  ('taiwan', 'Taiwan', false),
  ('tanzania', 'Tanzania', false),
  ('thailand', 'Thailand', false),
  ('timor-leste', 'Timor-Leste', false),
  ('uganda', 'Uganda', false),
  ('usa (hawaii)', 'USA (Hawaii)', false),
  ('venezuela', 'Venezuela', false),
  ('vietnam', 'Vietnam', false),
  ('yemen', 'Yemen', false),
  ('zambia', 'Zambia', false),
  ('zimbabwe', 'Zimbabwe', false),
  ('brasil', 'Brazil', false),
  ('brasilien', 'Brazil', false),
  ('kolumbien', 'Colombia', false),
  ('äthiopien', 'Ethiopia', false),
  ('aethiopien', 'Ethiopia', false),
  ('etiopia', 'Ethiopia', false),
  ('etiopía', 'Ethiopia', false),
  ('kenia', 'Kenya', false),
  ('ruanda', 'Rwanda', false),
  ('indonesien', 'Indonesia', false),
  ('mexiko', 'Mexico', false),
  ('méxico', 'Mexico', false),
  ('jemen', 'Yemen', false),
  ('perú', 'Peru', false),
  ('panamá', 'Panama', false),
  ('honduras', 'Honduras', false),
  ('nikaragua', 'Nicaragua', false),
  ('guatemala', 'Guatemala', false),
  ('tansania', 'Tanzania', false),
  ('sambia', 'Zambia', false),
  ('simbabwe', 'Zimbabwe', false),
  ('kuba', 'Cuba', false),
  ('kongo', 'DR Congo', false),
  ('congo', 'DR Congo', false),
  ('drc', 'DR Congo', false),
  ('dr kongo', 'DR Congo', false),
  ('demokratische republik kongo', 'DR Congo', false),
  ('costa rica', 'Costa Rica', false),
  ('el salvador', 'El Salvador', false),
  ('salvador', 'El Salvador', false),
  ('ost-timor', 'Timor-Leste', false),
  ('osttimor', 'Timor-Leste', false),
  ('east timor', 'Timor-Leste', false),
  ('papua-neuguinea', 'Papua New Guinea', false),
  ('png', 'Papua New Guinea', false),
  ('dominikanische republik', 'Dominican Republic', false),
  ('república dominicana', 'Dominican Republic', false),
  ('philippinen', 'Philippines', false),
  ('filipinas', 'Philippines', false),
  ('vietnam', 'Vietnam', false),
  ('viet nam', 'Vietnam', false),
  ('indien', 'India', false),
  ('usa', 'USA (Hawaii)', false),
  ('hawaii', 'USA (Hawaii)', false),
  ('kona', 'USA (Hawaii)', true),
  ('sumatra', 'Indonesia', true),
  ('java', 'Indonesia', true),
  ('sulawesi', 'Indonesia', true),
  ('flores', 'Indonesia', true),
  ('bali', 'Indonesia', true),
  ('yunnan', 'China', true)
), p as (
  select c.id, x.part, x.n
  from public.coffees c, regexp_split_to_table(btrim(c.origin), '\s*[,;/|]\s*|\s+[-–]\s+') with ordinality as x(part, n)
  where nullif(btrim(c.origin), '') is not null and btrim(x.part) <> ''
), k as (
  select p.id, p.part, p.n, o.country, o.regional from p left join origin_names o on o.name = lower(btrim(p.part))
), one as (   -- exactly one country named
  select id, min(country) as country from k where country is not null group by id having count(distinct country) = 1
), fixed as (
  select one.id, one.country || coalesce(', ' || string_agg(btrim(k.part), ', ' order by k.n) filter (where k.country is null or k.regional), '') as origin
  from one join k on k.id = one.id group by one.id, one.country
)
update public.coffees c set origin = f.origin from fixed f where f.id = c.id and c.origin is distinct from f.origin;

commit;

-- To check: select name, origin from coffees order by origin;
