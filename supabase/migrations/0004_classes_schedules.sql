-- Sprint 3: Academic classes, memberships, mentor assignments, and schedules.
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  package_id uuid references public.packages(id) on delete set null,
  level text,
  capacity integer not null default 20 check (capacity > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_classes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, class_id)
);

create table if not exists public.mentor_assignments (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (mentor_id, class_id)
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  room text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- The table may have been created manually before this migration. Reconcile the
-- Sprint 3 columns before adding indexes and constraints below.
alter table public.classes add column if not exists description text;
alter table public.classes add column if not exists level text;
alter table public.schedules add column if not exists class_id uuid references public.classes(id) on delete cascade;
alter table public.schedules add column if not exists mentor_id uuid references public.mentors(id) on delete restrict;
alter table public.schedules add column if not exists starts_at timestamptz;
alter table public.schedules add column if not exists ends_at timestamptz;
alter table public.schedules add column if not exists room text;
alter table public.schedules add column if not exists notes text;
alter table public.schedules add column if not exists created_at timestamptz not null default now();
alter table public.schedules add column if not exists updated_at timestamptz not null default now();

-- Last line of defence for concurrent writes that bypass the application check.
create extension if not exists btree_gist;
alter table public.schedules drop constraint if exists schedules_no_class_overlap;
alter table public.schedules add constraint schedules_no_class_overlap exclude using gist (class_id with =, tstzrange(starts_at, ends_at, '[)') with &&);
alter table public.schedules drop constraint if exists schedules_no_mentor_overlap;
alter table public.schedules add constraint schedules_no_mentor_overlap exclude using gist (mentor_id with =, tstzrange(starts_at, ends_at, '[)') with &&);

create index if not exists student_classes_class_id_idx on public.student_classes(class_id);
create index if not exists mentor_assignments_class_id_idx on public.mentor_assignments(class_id);
create index if not exists schedules_class_time_idx on public.schedules(class_id, starts_at, ends_at);
create index if not exists schedules_mentor_time_idx on public.schedules(mentor_id, starts_at, ends_at);

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
drop trigger if exists schedules_set_updated_at on public.schedules;
create trigger schedules_set_updated_at before update on public.schedules for each row execute function public.set_updated_at();

alter table public.classes enable row level security;
alter table public.student_classes enable row level security;
alter table public.mentor_assignments enable row level security;
alter table public.schedules enable row level security;

drop policy if exists "admins_manage_classes" on public.classes;
create policy "admins_manage_classes" on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_manage_student_classes" on public.student_classes;
create policy "admins_manage_student_classes" on public.student_classes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_manage_mentor_assignments" on public.mentor_assignments;
create policy "admins_manage_mentor_assignments" on public.mentor_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_manage_schedules" on public.schedules;
create policy "admins_manage_schedules" on public.schedules for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on table public.classes, public.student_classes, public.mentor_assignments, public.schedules to authenticated;
