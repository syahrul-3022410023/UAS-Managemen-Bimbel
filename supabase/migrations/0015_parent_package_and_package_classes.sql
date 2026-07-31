-- Revisi: packages are chosen for parents and contain operational classes.
alter table public.parents
  add column if not exists package_id uuid references public.packages(id) on delete set null;

create table if not exists public.package_classes (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (package_id, class_id)
);

insert into public.package_classes (package_id, class_id)
select package_id, id
from public.classes
where package_id is not null
on conflict (package_id, class_id) do nothing;

update public.parents p
set package_id = first_child.package_id
from (
  select distinct on (parent_id) parent_id, package_id
  from public.students
  where parent_id is not null
    and package_id is not null
  order by parent_id, created_at
) first_child
where p.id = first_child.parent_id
  and p.package_id is null;

insert into public.student_classes (student_id, class_id)
select s.id, pc.class_id
from public.students s
join public.parents p on p.id = s.parent_id
join public.package_classes pc on pc.package_id = p.package_id
where p.package_id is not null
on conflict (student_id, class_id) do nothing;

create index if not exists parents_package_id_idx on public.parents(package_id);
create index if not exists package_classes_package_id_idx on public.package_classes(package_id);
create index if not exists package_classes_class_id_idx on public.package_classes(class_id);

alter table public.package_classes enable row level security;

drop policy if exists "admins_manage_package_classes" on public.package_classes;
create policy "admins_manage_package_classes"
on public.package_classes
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on table public.package_classes to authenticated;
