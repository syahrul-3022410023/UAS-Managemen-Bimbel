-- Paket bimbel can be scoped to one subject, or left null for all subjects.
alter table public.packages
  add column if not exists subject_id uuid references public.subjects(id) on delete set null;

create index if not exists packages_subject_id_idx on public.packages(subject_id);
