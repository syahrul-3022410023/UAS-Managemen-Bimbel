-- Supabase requires both RLS policies and table privileges for authenticated users.
grant select, insert, update, delete on table
  public.parents,
  public.mentors,
  public.packages,
  public.subjects,
  public.students
to authenticated;
