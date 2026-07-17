-- Reconcile the optional grade-level field for databases whose classes table
-- was created before the field was introduced.
alter table public.classes add column if not exists level text;

notify pgrst, 'reload schema';
