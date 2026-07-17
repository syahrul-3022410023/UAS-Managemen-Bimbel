-- Sprint 5: Invoice & Pembayaran
-- ─────────────────────────────────────────────────────────────────────────────

-- invoices table
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id) on delete cascade,
  package_id      uuid references public.packages(id) on delete set null,
  amount          numeric(14, 2) not null check (amount >= 0),
  due_date        date not null,
  status          text not null default 'unpaid'
                  check (status in ('unpaid', 'partial', 'paid', 'cancelled')),
  month           integer not null check (month between 1 and 12),
  year            integer not null check (year >= 2020),
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- satu siswa hanya boleh punya 1 invoice aktif per bulan/tahun
  unique (student_id, month, year)
);

-- payments table
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  amount           numeric(14, 2) not null check (amount > 0),
  method           text not null default 'cash'
                   check (method in ('cash', 'transfer', 'qris', 'other')),
  reference_number text,
  notes            text,
  paid_at          timestamptz not null default now(),
  recorded_by      uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Indexes
create index if not exists invoices_student_idx  on public.invoices(student_id);
create index if not exists invoices_status_idx   on public.invoices(status);
create index if not exists invoices_year_month_idx on public.invoices(year, month);
create index if not exists payments_invoice_idx  on public.payments(invoice_id);
create index if not exists payments_paid_at_idx  on public.payments(paid_at);

-- updated_at triggers
drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.invoices enable row level security;
alter table public.payments  enable row level security;

-- Admin: full access
drop policy if exists "admins_manage_invoices" on public.invoices;
create policy "admins_manage_invoices"
  on public.invoices for all to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins_manage_payments" on public.payments;
create policy "admins_manage_payments"
  on public.payments for all to authenticated
  using  (public.is_admin())
  with check (public.is_admin());

-- Parent: read-only own children invoices
create or replace function public.is_parent_for_invoice(target_invoice_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from   public.invoices i
    join   public.students s  on s.id = i.student_id
    join   public.parents  p  on p.id = s.parent_id
    where  i.id = target_invoice_id
    and    p.profile_id = auth.uid()
  );
$$;

drop policy if exists "parents_view_own_invoices" on public.invoices;
create policy "parents_view_own_invoices"
  on public.invoices for select to authenticated
  using (public.is_parent_for_invoice(id));

drop policy if exists "parents_view_own_payments" on public.payments;
create policy "parents_view_own_payments"
  on public.payments for select to authenticated
  using (public.is_parent_for_invoice(invoice_id));

-- Grants
grant select, insert, update, delete
  on table public.invoices, public.payments
  to authenticated;
