-- Add package scope to schedules and connect paid payrolls to cash flow entries.
alter table public.schedules
  add column if not exists package_id uuid references public.packages(id) on delete set null;

create index if not exists schedules_package_idx on public.schedules(package_id);

alter table public.payrolls
  add column if not exists cash_flow_id uuid references public.cash_flows(id) on delete set null;

create index if not exists payrolls_cash_flow_idx on public.payrolls(cash_flow_id);
