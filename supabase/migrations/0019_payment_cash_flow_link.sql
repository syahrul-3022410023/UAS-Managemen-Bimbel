-- Link SPP payments to cash flow entries so cash balance updates automatically.
alter table public.payments
  add column if not exists cash_flow_id uuid references public.cash_flows(id) on delete set null;

create index if not exists payments_cash_flow_idx on public.payments(cash_flow_id);
