-- Repair databases where `classes` existed before Sprint 3 was applied.
-- `create table if not exists` does not add newly declared columns to an
-- existing table, which left the API schema without `classes.description`.
alter table public.classes add column if not exists description text;

-- Remove any legacy policy on the junction table. A policy that reads
-- `student_classes` from another `student_classes` policy causes PostgreSQL
-- to recurse while evaluating RLS. Recreate the supported policies below,
-- whose membership checks are isolated in SECURITY DEFINER helper functions.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'student_classes'
  loop
    execute format('drop policy if exists %I on public.student_classes', policy_name);
  end loop;
end;
$$;

create or replace function public.is_current_mentor(target_mentor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.mentors
    where id = target_mentor_id and profile_id = auth.uid()
  );
$$;

create or replace function public.is_mentor_for_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.mentor_assignments ma
    join public.mentors m on m.id = ma.mentor_id
    where ma.class_id = target_class_id and m.profile_id = auth.uid()
  );
$$;

create or replace function public.is_parent_for_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.students s
    join public.parents p on p.id = s.parent_id
    where s.id = target_student_id and p.profile_id = auth.uid()
  );
$$;

create policy "admins_manage_student_classes"
on public.student_classes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "mentors_view_class_members"
on public.student_classes
for select
to authenticated
using (public.is_mentor_for_class(class_id));

create policy "parents_view_child_classes"
on public.student_classes
for select
to authenticated
using (public.is_parent_for_student(student_id));

-- Refresh PostgREST's schema cache after the repaired column is present.
notify pgrst, 'reload schema';
