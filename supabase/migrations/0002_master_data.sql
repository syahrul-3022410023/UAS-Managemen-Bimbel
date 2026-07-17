-- Sprint 2: Master data used by the admin workspace.
create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  phone text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  phone text not null,
  specialization text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  duration_months integer not null check (duration_months > 0),
  sessions_per_month integer not null check (sessions_per_month > 0),
  price numeric(12, 2) not null check (price >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  student_number text not null unique,
  birth_date date,
  school_name text,
  grade text,
  parent_id uuid references public.parents(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_parent_id_idx on public.students(parent_id);
create index if not exists students_package_id_idx on public.students(package_id);

drop trigger if exists parents_set_updated_at on public.parents;
create trigger parents_set_updated_at before update on public.parents for each row execute function public.set_updated_at();
drop trigger if exists mentors_set_updated_at on public.mentors;
create trigger mentors_set_updated_at before update on public.mentors for each row execute function public.set_updated_at();
drop trigger if exists packages_set_updated_at on public.packages;
create trigger packages_set_updated_at before update on public.packages for each row execute function public.set_updated_at();
drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at before update on public.subjects for each row execute function public.set_updated_at();
drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();

alter table public.parents enable row level security;
alter table public.mentors enable row level security;
alter table public.packages enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "admins_manage_parents" on public.parents for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_mentors" on public.mentors for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_packages" on public.packages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_subjects" on public.subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins_manage_students" on public.students for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on table
  public.parents,
  public.mentors,
  public.packages,
  public.subjects,
  public.students
to authenticated;
