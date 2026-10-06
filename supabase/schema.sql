-- WellPoint — Supabase schema (revision v2)
-- Run this in the Supabase SQL editor. It DROPS the previous demo tables and
-- recreates them with PSGC-coded foreign keys, DRRM warnings, and row-level
-- security that bounds every persona.
--
-- WARNING: drops demo data. Back up anything you need first.

drop table if exists public.barangay_officials cascade;
drop table if exists public.barangay_status cascade;
drop table if exists public.warning_barangays cascade;
drop table if exists public.warnings cascade;
drop table if exists public.reports cascade;
drop table if exists public.water_sources cascade;
drop table if exists public.barangays cascade;
drop table if exists public.water_systems cascade;
drop table if exists public.profiles cascade;

-- =====================================================================
-- water_systems (the 5 pilot systems, static reference data)
-- =====================================================================
create table public.water_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null check (level in ('I','II','III')),
  service_hours integer not null default 12,
  operator text,
  affordability integer not null default 50,
  population integer not null default 0
);

-- =====================================================================
-- barangays (the 57 Catbalogan barangays, metadata only; geometry lives in the GeoJSON)
-- =====================================================================
create table public.barangays (
  psgc_code text primary key,
  name text not null,
  area_sqkm numeric not null default 0,
  lat double precision not null,
  lng double precision not null,
  distance_to_center_km numeric not null default 0,
  population integer not null default 0,
  affordability integer not null default 50,
  system_id uuid null references public.water_systems (id)
);

-- =====================================================================
-- profiles (identity + role + scope)
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  role text not null default 'citizen' check (role in ('citizen','official','lgu','drrm')),
  barangay_psgc text null references public.barangays (psgc_code),
  last_login_at timestamptz
);

-- =====================================================================
-- water_sources (physical markers)
-- =====================================================================
create table public.water_sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('pump','well','reservoir','station')),
  name text not null,
  lng double precision not null,
  lat double precision not null,
  status text not null default 'ok' check (status in ('ok','low','empty','repair','unsafe')),
  barangay_psgc text null references public.barangays (psgc_code),
  system_id uuid null references public.water_systems (id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- reports (community reports)
-- =====================================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id),
  barangay_psgc text not null references public.barangays (psgc_code),
  type text not null check (type in ('no_water','low_pressure','contamination','infrastructure_damage','other')),
  description text,
  status text not null default 'new' check (status in ('new','acknowledged','resolved')),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- warnings (DRRM-authored early warnings; LGU may resolve for oversight)
-- =====================================================================
create table public.warnings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id),
  type text not null check (type in ('outage','contamination','disaster','maintenance','advisory')),
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  title text not null,
  message text not null,
  action text,
  status text not null default 'active' check (status in ('active','resolved','cancelled')),
  created_at timestamptz not null default now()
);

create table public.warning_barangays (
  warning_id uuid not null references public.warnings (id) on delete cascade,
  barangay_psgc text not null references public.barangays (psgc_code) on delete cascade,
  primary key (warning_id, barangay_psgc)
);

-- =====================================================================
-- Auth triggers
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, barangay_psgc)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'citizen'),
    nullif(new.raw_user_meta_data ->> 'barangay_psgc', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RLS helpers
-- =====================================================================
-- SECURITY DEFINER so these can read public.profiles from inside the profiles
-- RLS policy without re-entering it (which otherwise recurses until Postgres
-- raises "stack depth limit exceeded").
create or replace function public.user_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'citizen')
$$;

create or replace function public.user_barangay()
returns text language sql stable security definer set search_path = public as $$
  select (select barangay_psgc from public.profiles where id = auth.uid())
$$;

create or replace function public.can_place(kind text, barangay_psgc text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    (public.user_role() = 'drrm' and kind = 'station')
    or (public.user_role() = 'official' and kind in ('pump','well','reservoir') and barangay_psgc is not distinct from public.user_barangay())
$$;

create or replace function public.can_set_status(kind text, barangay_psgc text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    (public.user_role() = 'drrm' and kind = 'station')
    or (public.user_role() = 'official' and kind in ('pump','well','reservoir') and barangay_psgc is not distinct from public.user_barangay())
$$;

create or replace function public.can_triage_report(barangay_psgc text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.user_role() = 'lgu'
    or (public.user_role() = 'official' and barangay_psgc is not distinct from public.user_barangay())
$$;

-- =====================================================================
-- Row-level security
-- =====================================================================

-- barangays + water_systems: read by any signed-in user
alter table public.barangays enable row level security;
create policy "barangays_read" on public.barangays for select to authenticated using (true);

alter table public.water_systems enable row level security;
create policy "water_systems_read" on public.water_systems for select to authenticated using (true);

-- profiles: own row, plus LGU can read/update all (role management)
alter table public.profiles enable row level security;
create policy "profiles_read_own" on public.profiles for select to authenticated using (id = auth.uid() or public.user_role() = 'lgu');
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid() or public.user_role() = 'lgu')
  with check (id = auth.uid() or public.user_role() = 'lgu');

-- water_sources
alter table public.water_sources enable row level security;
create policy "water_sources_read" on public.water_sources for select to authenticated using (true);
create policy "water_sources_insert" on public.water_sources for insert to authenticated
  with check (public.can_place(kind, barangay_psgc));
create policy "water_sources_update" on public.water_sources for update to authenticated
  using (public.can_set_status(kind, barangay_psgc))
  with check (public.can_set_status(kind, barangay_psgc));
create policy "water_sources_delete" on public.water_sources for delete to authenticated
  using (public.can_place(kind, barangay_psgc));

-- reports
alter table public.reports enable row level security;
create policy "reports_read" on public.reports for select to authenticated using (true);
create policy "reports_insert" on public.reports for insert to authenticated
  with check (
    public.user_role() in ('official','citizen')
    and barangay_psgc is not distinct from public.user_barangay()
  );
create policy "reports_update" on public.reports for update to authenticated
  using (public.can_triage_report(barangay_psgc))
  with check (public.can_triage_report(barangay_psgc));
create policy "reports_delete" on public.reports for delete to authenticated
  using (public.can_triage_report(barangay_psgc));

-- warnings
alter table public.warnings enable row level security;
create policy "warnings_read" on public.warnings for select to authenticated using (true);
create policy "warnings_insert" on public.warnings for insert to authenticated
  with check (public.user_role() = 'drrm');
create policy "warnings_update" on public.warnings for update to authenticated
  using (public.user_role() = 'lgu' or (public.user_role() = 'drrm' and author_id = auth.uid()))
  with check (public.user_role() = 'lgu' or (public.user_role() = 'drrm' and author_id = auth.uid()));
create policy "warnings_delete" on public.warnings for delete to authenticated
  using (public.user_role() = 'lgu' or (public.user_role() = 'drrm' and author_id = auth.uid()));

alter table public.warning_barangays enable row level security;
create policy "warning_barangays_read" on public.warning_barangays for select to authenticated using (true);
create policy "warning_barangays_insert" on public.warning_barangays for insert to authenticated
  with check (public.user_role() = 'drrm');
create policy "warning_barangays_delete" on public.warning_barangays for delete to authenticated
  using (public.user_role() = 'drrm');

-- =====================================================================
-- barangay_status (LGU/Water-District-managed per-barangay service overrides)
-- A row replaces the seeded/derived live values (available, flow, quality,
-- affordability) for one barangay; its absence means the seeded/deterministic
-- state applies. This is the persisted source of truth behind both the
-- "simulate disruption" demo control and the LGU water-status editor, so a
-- change raises or clears alerts live for every user.
-- =====================================================================
create table public.barangay_status (
  psgc_code text primary key references public.barangays (psgc_code) on delete cascade,
  available boolean not null,
  flow integer not null check (flow between 0 and 200),
  quality text not null check (quality in ('safe','advisory','unsafe')),
  affordability integer not null check (affordability between 0 and 100),
  set_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

alter table public.barangay_status enable row level security;
create policy "barangay_status_read" on public.barangay_status for select to authenticated using (true);
create policy "barangay_status_insert" on public.barangay_status for insert to authenticated
  with check (public.user_role() = 'lgu');
create policy "barangay_status_update" on public.barangay_status for update to authenticated
  using (public.user_role() = 'lgu')
  with check (public.user_role() = 'lgu');
create policy "barangay_status_delete" on public.barangay_status for delete to authenticated
  using (public.user_role() = 'lgu');

-- =====================================================================
-- barangay_officials (representative / official directory per barangay)
-- Readable by all signed-in users so the drill-down can show who to contact;
-- managed by the LGU.
-- =====================================================================
create table public.barangay_officials (
  id uuid primary key default gen_random_uuid(),
  barangay_psgc text not null references public.barangays (psgc_code) on delete cascade,
  position text not null,
  name text not null,
  contact text,
  email text
);

alter table public.barangay_officials enable row level security;
create policy "barangay_officials_read" on public.barangay_officials for select to authenticated using (true);
create policy "barangay_officials_insert" on public.barangay_officials for insert to authenticated
  with check (public.user_role() = 'lgu');
create policy "barangay_officials_update" on public.barangay_officials for update to authenticated
  using (public.user_role() = 'lgu')
  with check (public.user_role() = 'lgu');
create policy "barangay_officials_delete" on public.barangay_officials for delete to authenticated
  using (public.user_role() = 'lgu');

-- =====================================================================
-- Seed data
-- =====================================================================

-- 5 pilot systems (fixed UUIDs so the client's deterministic flow series can key off them)
insert into public.water_systems (id, name, level, service_hours, operator, affordability, population) values
  ('10000000-0000-4000-8000-000000000001', 'Poblacion 1 Water System', 'III', 24, 'Catbalogan Water District', 80, 8500),
  ('10000000-0000-4000-8000-000000000002', 'San Andres Spring System', 'II', 18, 'Barangay Water Association', 55, 4200),
  ('10000000-0000-4000-8000-000000000003', 'Mercedes Groundwater System', 'II', 20, 'Barangay Water Association', 50, 3000),
  ('10000000-0000-4000-8000-000000000004', 'Bangon Spring System', 'I', 12, 'Barangay Council', 30, 2500),
  ('10000000-0000-4000-8000-000000000005', 'Canlapwas Spring System', 'I', 10, 'Barangay Council', 25, 1500);

-- 57 barangays (deterministic values from seed-data; see lib/seed.ts)
insert into public.barangays (psgc_code, name, area_sqkm, lat, lng, distance_to_center_km, population, affordability, system_id) values
('0806005001', 'Albalate', 8.361658, 11.863998, 124.900746, 9.800, 6037, 47, null),
('0806005002', 'Bagongon', 0.797348, 11.800605, 124.705685, 19.256, 478, 47, null),
('0806005003', 'Bangon', 3.581352, 11.881922, 124.875658, 11.571, 2500, 30, '10000000-0000-4000-8000-000000000004'),
('0806005004', 'Basiao', 1.295823, 11.703195, 124.882028, 8.318, 885, 74, null),
('0806005005', 'Buluan', 0.406655, 11.814369, 124.739613, 15.920, 400, 50, null),
('0806005006', 'Bunuanan', 1.093078, 11.756601, 124.891729, 2.647, 666, 59, null),
('0806005007', 'Cabugawan', 0.958034, 11.808161, 124.827612, 6.716, 400, 52, null),
('0806005008', 'Cagudalo', 6.321061, 11.861164, 124.878682, 9.251, 3967, 71, null),
('0806005009', 'Cagusipan', 17.548115, 11.896387, 124.942393, 14.759, 8451, 60, null),
('0806005011', 'Cagutian', 10.423731, 11.889872, 124.904314, 12.694, 8059, 74, null),
('0806005012', 'Cagutsan', 1.102060, 11.820331, 124.680554, 22.327, 455, 52, null),
('0806005013', 'Canhawan Gote', 0.348804, 11.823033, 124.726781, 17.524, 400, 64, null),
('0806005014', 'Canlapwas (Pob.)', 0.695220, 11.781473, 124.887001, 0.752, 1500, 25, '10000000-0000-4000-8000-000000000005'),
('0806005015', 'Cawayan', 5.174256, 11.792210, 124.916552, 4.173, 2754, 63, null),
('0806005016', 'Cinco', 1.326094, 11.830168, 124.702716, 20.261, 987, 55, null),
('0806005017', 'Darahuway Daco', 0.357648, 11.741001, 124.877361, 4.134, 400, 71, null),
('0806005018', 'Darahuway Gote', 0.109410, 11.748159, 124.871718, 3.471, 400, 47, null),
('0806005019', 'Estaka', 0.509074, 11.798974, 124.833562, 5.673, 400, 73, null),
('0806005020', 'Guinsorongan', 0.861345, 11.761346, 124.888851, 2.036, 615, 70, null),
('0806005021', 'Iguid', 7.547290, 11.833845, 124.853328, 6.905, 4702, 62, null),
('0806005022', 'Lagundi', 2.505148, 11.765253, 124.906681, 3.127, 1316, 57, null),
('0806005023', 'Libas', 9.049938, 11.839657, 124.893337, 6.985, 3555, 53, null),
('0806005024', 'Lobo', 6.449946, 11.841322, 124.926239, 8.588, 2963, 57, null),
('0806005025', 'Manguehay', 12.064872, 11.816789, 124.912105, 5.479, 9311, 62, null),
('0806005026', 'Maulong', 4.771499, 11.796280, 124.878753, 2.048, 3740, 50, null),
('0806005027', 'Mercedes', 1.668055, 11.785758, 124.878620, 0.903, 3000, 50, '10000000-0000-4000-8000-000000000003'),
('0806005028', 'Mombon', 1.352745, 11.805388, 124.690867, 20.926, 1044, 55, null),
('0806005029', 'New Mahayag', 7.742132, 11.850346, 124.840985, 9.152, 3203, 50, null),
('0806005030', 'Old Mahayag', 2.472256, 11.849152, 124.820889, 10.272, 1124, 68, null),
('0806005031', 'Palanyogon', 5.069146, 11.864326, 124.862366, 9.813, 3433, 48, null),
('0806005032', 'Pangdan', 3.525625, 11.749645, 124.913936, 4.769, 1557, 55, null),
('0806005033', 'Payao', 3.370770, 11.806046, 124.876399, 3.160, 1499, 58, null),
('0806005034', 'Poblacion 1 (Barangay 1)', 0.046135, 11.777998, 124.881072, 0.000, 8500, 80, '10000000-0000-4000-8000-000000000001'),
('0806005035', 'Poblacion 2 (Barangay 2)', 0.032129, 11.778097, 124.882014, 0.103, 400, 50, null),
('0806005036', 'Poblacion 3 (Barangay 3)', 0.071334, 11.775691, 124.880535, 0.263, 400, 72, null),
('0806005037', 'Poblacion 4 (Barangay 4)', 0.068474, 11.775206, 124.880036, 0.330, 400, 56, null),
('0806005038', 'Poblacion 5 (Barangay 5)', 0.054372, 11.774217, 124.881028, 0.420, 400, 64, null),
('0806005039', 'Poblacion 6 (Barangay 6)', 0.078973, 11.773242, 124.881744, 0.534, 400, 60, null),
('0806005040', 'Poblacion 7 (Barangay 7)', 0.114987, 11.773448, 124.884650, 0.638, 400, 68, null),
('0806005041', 'Poblacion 8 (Barangay 8)', 0.043743, 11.769864, 124.883288, 0.936, 400, 47, null),
('0806005042', 'Poblacion 9 (Barangay 9)', 0.299865, 11.765867, 124.887935, 1.542, 400, 57, null),
('0806005043', 'Poblacion 10 (Barangay 10)', 0.045472, 11.778190, 124.883841, 0.302, 400, 73, null),
('0806005044', 'Poblacion 11 (Barangay 11)', 0.036726, 11.777430, 124.884137, 0.340, 400, 71, null),
('0806005045', 'Poblacion 12 (Barangay 12)', 0.033749, 11.776383, 124.884502, 0.414, 400, 57, null),
('0806005046', 'Poblacion 13 (Barangay 13)', 0.392172, 11.775909, 124.888358, 0.826, 400, 69, null),
('0806005047', 'Muñoz (Poblacion 14)', 0.136798, 11.781116, 124.883313, 0.424, 400, 60, null),
('0806005048', 'Pupua', 9.545915, 11.819369, 124.872332, 4.698, 5984, 54, null),
('0806005049', 'Guindaponan', 1.885728, 11.772045, 124.895925, 1.747, 1460, 68, null),
('0806005050', 'Rama', 1.105871, 11.829643, 124.692516, 21.311, 598, 56, null),
('0806005051', 'San Andres', 5.784909, 11.785486, 124.901098, 2.333, 4200, 55, '10000000-0000-4000-8000-000000000002'),
('0806005052', 'San Pablo', 0.044460, 11.779184, 124.882562, 0.209, 400, 58, null),
('0806005053', 'San Roque', 0.950722, 11.807132, 124.834737, 5.994, 451, 54, null),
('0806005054', 'San Vicente', 4.955615, 11.866571, 124.839911, 10.820, 2892, 52, null),
('0806005055', 'Silanga', 1.684215, 11.820030, 124.844926, 6.109, 1278, 58, null),
('0806005056', 'Totoringon', 12.128320, 11.864749, 124.931007, 11.072, 8820, 51, null),
('0806005057', 'Ibol', 0.637685, 11.755694, 124.901413, 3.325, 400, 62, null),
('0806005059', 'Socorro', 0.371477, 11.767558, 124.891334, 1.611, 400, 55, null);

-- Demo water sources (fixed UUIDs + PSGC/system links)
insert into public.water_sources (id, kind, name, lng, lat, status, barangay_psgc, system_id) values
  ('00000000-0000-4000-8000-000000000001', 'pump',      'Poblacion pump',     124.891, 11.779, 'ok',     '0806005034', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002', 'well',      'Poblacion well',     124.892, 11.781, 'ok',     '0806005034', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', 'reservoir', 'Poblacion reservoir',124.893, 11.783, 'ok',     '0806005034', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', 'well',      'San Andres spring',  124.905, 11.815, 'low',    '0806005051', '10000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000005', 'well',      'Mercedes well',      124.868, 11.795, 'ok',     '0806005027', '10000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000006', 'well',      'Bangon spring',      124.938, 11.862, 'low',    '0806005003', '10000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8000-000000000007', 'well',      'Canlapwas spring',   124.962, 11.872, 'unsafe', '0806005014', '10000000-0000-4000-8000-000000000005');

-- Demo barangay officials (placeholder directory — replace with the LGU roster)
insert into public.barangay_officials (barangay_psgc, position, name, contact, email) values
  ('0806005034', 'Barangay Captain', 'Maria Santos',     '0917 000 0001', 'brgy.poblacion1@catbalogan.gov.ph'),
  ('0806005051', 'Barangay Captain', 'Jose Ramirez',     '0917 000 0002', 'brgy.sanandres@catbalogan.gov.ph'),
  ('0806005027', 'Barangay Captain', 'Ana Reyes',        '0917 000 0003', 'brgy.mercedes@catbalogan.gov.ph'),
  ('0806005003', 'Barangay Captain', 'Pedro Garcia',     '0917 000 0004', 'brgy.bangon@catbalogan.gov.ph'),
  ('0806005014', 'Barangay Captain', 'Liza Mendoza',     '0917 000 0005', 'brgy.canlapwas@catbalogan.gov.ph');
