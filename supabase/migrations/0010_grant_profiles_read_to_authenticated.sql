-- RLS policies decide which profile rows an authenticated user may see;
-- PostgreSQL still also requires a table-level SELECT grant.
grant select on table public.profiles to authenticated;
