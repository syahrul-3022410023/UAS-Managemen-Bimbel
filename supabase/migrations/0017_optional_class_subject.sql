-- Classes no longer require a separate subject selection in the UX.
alter table public.classes
  alter column subject_id drop not null;
