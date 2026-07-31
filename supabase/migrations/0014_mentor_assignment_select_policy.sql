drop policy if exists "mentors_view_own_assignments" on public.mentor_assignments;
create policy "mentors_view_own_assignments"
on public.mentor_assignments
for select
to authenticated
using (public.is_current_mentor(mentor_id));

notify pgrst, 'reload schema';
