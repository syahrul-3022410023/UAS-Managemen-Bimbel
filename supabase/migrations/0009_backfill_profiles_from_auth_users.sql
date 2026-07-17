-- Backfill profiles for accounts created before the profile trigger was
-- installed. The application reads a user's role from the same metadata.
insert into public.profiles (id, email, full_name, role)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(users.raw_user_meta_data ->> 'full_name', ''),
  case coalesce(users.raw_app_meta_data ->> 'role', users.raw_user_meta_data ->> 'role')
    when 'admin' then 'admin'
    when 'mentor' then 'mentor'
    when 'parent' then 'parent'
    else 'parent'
  end
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
