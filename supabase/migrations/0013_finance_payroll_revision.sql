-- Revisi 2.0: student codes, richer packages, invoice SPP, payroll, and cash flow.

create sequence if not exists public.student_number_seq start 1;
create sequence if not exists public.invoice_number_seq start 1;

alter table public.students
  add column if not exists parent_phone text;

with max_existing as (
  select coalesce(max((substring(student_number from '[0-9]+'))::bigint), 0) as seq
  from public.students
  where student_number ~ '^STD-[0-9]{6}$'
),
numbered as (
  select id, row_number() over (order by created_at, id) as seq
  from public.students
  where student_number is null
     or student_number = ''
     or student_number !~ '^STD-[0-9]{6}$'
)
update public.students s
set student_number = 'STD-' || lpad((max_existing.seq + numbered.seq)::text, 6, '0')
from numbered, max_existing
where s.id = numbered.id;

alter table public.students
  alter column student_number set default ('STD-' || lpad(nextval('public.student_number_seq')::text, 6, '0'));

select setval(
  'public.student_number_seq',
  greatest(
    1,
    coalesce((select max((substring(student_number from '[0-9]+'))::bigint) from public.students where student_number ~ '^STD-[0-9]{6}$'), 0) + 1
  ),
  false
);

alter table public.packages
  add column if not exists level text,
  add column if not exists mentor_fee_per_session numeric(12, 2) not null default 0 check (mentor_fee_per_session >= 0),
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive'));

alter table public.invoices
  add column if not exists invoice_number text;

with max_existing as (
  select coalesce(max((substring(invoice_number from '[0-9]+'))::bigint), 0) as seq
  from public.invoices
  where invoice_number ~ '^INV-[0-9]{6}$'
),
numbered as (
  select id, row_number() over (order by created_at, id) as seq
  from public.invoices
  where invoice_number is null or invoice_number = ''
)
update public.invoices i
set invoice_number = 'INV-' || lpad((max_existing.seq + numbered.seq)::text, 6, '0')
from numbered, max_existing
where i.id = numbered.id;

alter table public.invoices
  alter column invoice_number set default ('INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0'));

select setval(
  'public.invoice_number_seq',
  greatest(
    1,
    coalesce((select max((substring(invoice_number from '[0-9]+'))::bigint) from public.invoices where invoice_number ~ '^INV-[0-9]{6}$'), 0) + 1
  ),
  false
);

create unique index if not exists invoices_invoice_number_key on public.invoices(invoice_number);

update public.invoices
set status = case when status = 'paid' then 'paid' else 'unpaid' end
where status not in ('unpaid', 'paid');

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices
  add constraint invoices_status_check check (status in ('unpaid', 'paid'));

create table if not exists public.payrolls (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2020),
  session_count integer not null default 0 check (session_count >= 0),
  session_amount numeric(14, 2) not null default 0 check (session_amount >= 0),
  bonus numeric(14, 2) not null default 0 check (bonus >= 0),
  deduction numeric(14, 2) not null default 0 check (deduction >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, month, year)
);

create table if not exists public.payroll_details (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.payrolls(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  subject_name text,
  class_name text,
  taught_at timestamptz,
  fee_per_session numeric(12, 2) not null default 0 check (fee_per_session >= 0),
  created_at timestamptz not null default now(),
  unique (payroll_id, schedule_id)
);

create table if not exists public.cash_flows (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric(14, 2) not null check (amount > 0),
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payrolls_period_idx on public.payrolls(year, month);
create index if not exists payrolls_mentor_idx on public.payrolls(mentor_id);
create index if not exists payroll_details_payroll_idx on public.payroll_details(payroll_id);
create index if not exists cash_flows_date_idx on public.cash_flows(transaction_date);
create index if not exists cash_flows_type_idx on public.cash_flows(type);

drop trigger if exists payrolls_set_updated_at on public.payrolls;
create trigger payrolls_set_updated_at before update on public.payrolls for each row execute function public.set_updated_at();
drop trigger if exists cash_flows_set_updated_at on public.cash_flows;
create trigger cash_flows_set_updated_at before update on public.cash_flows for each row execute function public.set_updated_at();

alter table public.payrolls enable row level security;
alter table public.payroll_details enable row level security;
alter table public.cash_flows enable row level security;

drop policy if exists "admins_manage_payrolls" on public.payrolls;
create policy "admins_manage_payrolls" on public.payrolls for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_manage_payroll_details" on public.payroll_details;
create policy "admins_manage_payroll_details" on public.payroll_details for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_manage_cash_flows" on public.cash_flows;
create policy "admins_manage_cash_flows" on public.cash_flows for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mentors_view_own_payrolls" on public.payrolls;
create policy "mentors_view_own_payrolls" on public.payrolls for select to authenticated using (public.is_current_mentor(mentor_id));
drop policy if exists "mentors_view_own_payroll_details" on public.payroll_details;
create policy "mentors_view_own_payroll_details" on public.payroll_details for select to authenticated using (
  exists (
    select 1
    from public.payrolls p
    where p.id = public.payroll_details.payroll_id
      and public.is_current_mentor(p.mentor_id)
  )
);

grant select, insert, update, delete on table public.payrolls, public.payroll_details, public.cash_flows to authenticated;
grant usage, select on sequence public.student_number_seq, public.invoice_number_seq to authenticated;
