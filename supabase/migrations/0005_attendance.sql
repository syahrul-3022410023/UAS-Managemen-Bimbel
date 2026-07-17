-- Sprint 4: Attendance is recorded once per student/mentor for each schedule.
create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, student_id)
);

create table if not exists public.mentor_attendance (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, mentor_id)
);

create index if not exists student_attendance_student_idx on public.student_attendance(student_id, recorded_at);
create index if not exists mentor_attendance_mentor_idx on public.mentor_attendance(mentor_id, recorded_at);
drop trigger if exists student_attendance_set_updated_at on public.student_attendance;
create trigger student_attendance_set_updated_at before update on public.student_attendance for each row execute function public.set_updated_at();
drop trigger if exists mentor_attendance_set_updated_at on public.mentor_attendance;
create trigger mentor_attendance_set_updated_at before update on public.mentor_attendance for each row execute function public.set_updated_at();

alter table public.student_attendance enable row level security;
alter table public.mentor_attendance enable row level security;
-- Sprint 4 read access for role dashboards and attendance screens.
-- SECURITY DEFINER helpers prevent recursive RLS checks between students and
-- student_classes while keeping each policy limited to the current user.
create or replace function public.is_current_mentor(target_mentor_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mentors where id = target_mentor_id and profile_id = auth.uid());
$$;
create or replace function public.is_mentor_for_class(target_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mentor_assignments ma join public.mentors m on m.id = ma.mentor_id where ma.class_id = target_class_id and m.profile_id = auth.uid());
$$;
create or replace function public.is_current_mentor_schedule(target_schedule_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.schedules s join public.mentors m on m.id = s.mentor_id where s.id = target_schedule_id and m.profile_id = auth.uid());
$$;
create or replace function public.is_parent_for_student(target_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s join public.parents p on p.id = s.parent_id where s.id = target_student_id and p.profile_id = auth.uid());
$$;
create or replace function public.is_parent_for_class(target_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.student_classes sc join public.students s on s.id = sc.student_id join public.parents p on p.id = s.parent_id where sc.class_id = target_class_id and p.profile_id = auth.uid());
$$;

drop policy if exists "mentors_view_assigned_classes" on public.classes;
drop policy if exists "mentors_view_own_profile" on public.mentors;
create policy "mentors_view_own_profile" on public.mentors for select to authenticated using (profile_id = auth.uid());
drop policy if exists "parents_view_own_profile" on public.parents;
create policy "parents_view_own_profile" on public.parents for select to authenticated using (profile_id = auth.uid());
create policy "mentors_view_assigned_classes" on public.classes for select to authenticated using (public.is_mentor_for_class(id));
drop policy if exists "mentors_view_own_schedules" on public.schedules;
create policy "mentors_view_own_schedules" on public.schedules for select to authenticated using (public.is_current_mentor(mentor_id));
drop policy if exists "mentors_view_class_members" on public.student_classes;
create policy "mentors_view_class_members" on public.student_classes for select to authenticated using (public.is_mentor_for_class(class_id));
drop policy if exists "mentors_view_students_in_class" on public.students;
create policy "mentors_view_students_in_class" on public.students for select to authenticated using (exists (select 1 from public.student_classes sc where sc.student_id = public.students.id and public.is_mentor_for_class(sc.class_id)));
drop policy if exists "parents_view_children" on public.students;
create policy "parents_view_children" on public.students for select to authenticated using (public.is_parent_for_student(id));
drop policy if exists "parents_view_child_classes" on public.student_classes;
create policy "parents_view_child_classes" on public.student_classes for select to authenticated using (public.is_parent_for_student(student_id));
drop policy if exists "parents_view_child_schedules" on public.schedules;
create policy "parents_view_child_schedules" on public.schedules for select to authenticated using (public.is_parent_for_class(class_id));
drop policy if exists "admins_manage_student_attendance" on public.student_attendance;
create policy "admins_manage_student_attendance" on public.student_attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_manage_mentor_attendance" on public.mentor_attendance;
create policy "admins_manage_mentor_attendance" on public.mentor_attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mentors_manage_class_student_attendance" on public.student_attendance;
create policy "mentors_manage_class_student_attendance" on public.student_attendance for all to authenticated using (public.is_current_mentor_schedule(schedule_id)) with check (public.is_current_mentor_schedule(schedule_id));
drop policy if exists "mentors_manage_own_attendance" on public.mentor_attendance;
create policy "mentors_manage_own_attendance" on public.mentor_attendance for all to authenticated using (public.is_current_mentor(mentor_id)) with check (public.is_current_mentor(mentor_id));
drop policy if exists "parents_view_child_attendance" on public.student_attendance;
create policy "parents_view_child_attendance" on public.student_attendance for select to authenticated using (public.is_parent_for_student(student_id));
grant select, insert, update, delete on table public.student_attendance, public.mentor_attendance to authenticated;
