-- Mentor fee belongs to the operational class, not the package sold to parents.
alter table public.classes
  add column if not exists mentor_fee_per_session numeric(12, 2) not null default 0 check (mentor_fee_per_session >= 0);

update public.classes c
set mentor_fee_per_session = coalesce(p.mentor_fee_per_session, 0)
from public.packages p
where c.package_id = p.id
  and c.mentor_fee_per_session = 0;
