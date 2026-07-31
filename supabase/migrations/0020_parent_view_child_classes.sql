-- Allow parents to read class names for their children's schedules and attendance views.
drop policy if exists "parents_view_child_class_rows" on public.classes;
create policy "parents_view_child_class_rows"
on public.classes
for select
to authenticated
using (public.is_parent_for_class(id));
