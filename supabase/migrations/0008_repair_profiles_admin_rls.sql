-- The original admin policy queried `profiles` from a policy on `profiles`,
-- which can recurse under RLS. `is_admin` is a SECURITY DEFINER helper and
-- safely performs the same check without recursively evaluating this table.
drop policy if exists "profiles_admin_manage_all" on public.profiles;

create policy "profiles_admin_manage_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on table public.profiles to authenticated;
