-- DevPlay Studio Admin Dashboard - Supabase Schema
-- Run this file in Supabase SQL Editor.

create type if not exists admin_role as enum ('owner', 'admin', 'viewer');
create type if not exists account_status as enum ('available', 'reserved', 'sold');

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role admin_role not null default 'viewer',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.game_accounts (
  id bigint generated always as identity primary key,
  code text unique,
  game text not null,
  account_name text not null,
  account_id text,
  server text,
  description text,
  price numeric default 0,
  purchase_cost numeric default 0,
  sell_price numeric default 0,
  profit numeric generated always as (sell_price - purchase_cost) stored,
  seller_whatsapp text,
  images text[] default '{}',
  internal_notes text,
  status account_status default 'available',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.account_policies (
  id bigint generated always as identity primary key,
  game text,
  type text check (type in ('sell', 'buy')) not null,
  title text not null,
  content text not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

create table if not exists public.sale_documents (
  id bigint generated always as identity primary key,
  account_id bigint references public.game_accounts(id) on delete set null,
  seller_name text not null,
  national_id text,
  id_card_image text,
  seller_with_card_image text,
  game text,
  account_game_id text,
  sale_price numeric default 0,
  declaration text,
  electronic_signature text,
  pdf_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create or replace function public.set_account_code()
returns trigger as $$
begin
  if new.code is null then
    new.code := 'ACC-' || lpad(new.id::text, 4, '0');
    update public.game_accounts set code = new.code where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_account_code on public.game_accounts;
create trigger trg_set_account_code
after insert on public.game_accounts
for each row
execute function public.set_account_code();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_game_accounts_updated on public.game_accounts;
create trigger trg_game_accounts_updated
before update on public.game_accounts
for each row execute function public.set_updated_at();

create or replace function public.current_admin_role()
returns text as $$
  select role::text
  from public.admin_users
  where id = auth.uid()
  and active = true
  limit 1;
$$ language sql security definer set search_path = public;

alter table public.admin_users enable row level security;
alter table public.game_accounts enable row level security;
alter table public.account_policies enable row level security;
alter table public.sale_documents enable row level security;

drop policy if exists "admins can view admin users" on public.admin_users;
create policy "admins can view admin users"
on public.admin_users for select
to authenticated
using (public.current_admin_role() in ('owner', 'admin', 'viewer'));

drop policy if exists "owner manages admin users" on public.admin_users;
create policy "owner manages admin users"
on public.admin_users for all
to authenticated
using (public.current_admin_role() = 'owner')
with check (public.current_admin_role() = 'owner');

drop policy if exists "admins view accounts" on public.game_accounts;
create policy "admins view accounts"
on public.game_accounts for select
to authenticated
using (public.current_admin_role() in ('owner', 'admin', 'viewer'));

drop policy if exists "owner admin insert accounts" on public.game_accounts;
create policy "owner admin insert accounts"
on public.game_accounts for insert
to authenticated
with check (public.current_admin_role() in ('owner', 'admin'));

drop policy if exists "owner admin update accounts" on public.game_accounts;
create policy "owner admin update accounts"
on public.game_accounts for update
to authenticated
using (public.current_admin_role() in ('owner', 'admin'))
with check (public.current_admin_role() in ('owner', 'admin'));

drop policy if exists "owner delete accounts" on public.game_accounts;
create policy "owner delete accounts"
on public.game_accounts for delete
to authenticated
using (public.current_admin_role() = 'owner');

drop policy if exists "admins view policies" on public.account_policies;
create policy "admins view policies"
on public.account_policies for select
to authenticated
using (public.current_admin_role() in ('owner', 'admin', 'viewer'));

drop policy if exists "owner admin manage policies" on public.account_policies;
create policy "owner admin manage policies"
on public.account_policies for all
to authenticated
using (public.current_admin_role() in ('owner', 'admin'))
with check (public.current_admin_role() in ('owner', 'admin'));

drop policy if exists "admins view sale docs" on public.sale_documents;
create policy "admins view sale docs"
on public.sale_documents for select
to authenticated
using (public.current_admin_role() in ('owner', 'admin', 'viewer'));

drop policy if exists "owner admin manage sale docs" on public.sale_documents;
create policy "owner admin manage sale docs"
on public.sale_documents for all
to authenticated
using (public.current_admin_role() in ('owner', 'admin'))
with check (public.current_admin_role() in ('owner', 'admin'));

create or replace view public.accounts_stats as
select
  count(*) as total_accounts,
  count(*) filter (where status = 'available') as available_accounts,
  count(*) filter (where status = 'reserved') as reserved_accounts,
  count(*) filter (where status = 'sold') as sold_accounts,
  coalesce(sum(purchase_cost), 0) as total_purchase_cost,
  coalesce(sum(sell_price) filter (where status = 'sold'), 0) as total_sales,
  coalesce(sum(profit) filter (where status = 'sold'), 0) as total_profit
from public.game_accounts;

-- Default policies content
insert into public.account_policies (game, type, title, content)
values
(null, 'sell', 'سياسة بيع عامة', 'أقر أنا البائع بأن الحساب ملكي بالكامل، وأنني قمت ببيعه إلى DevPlay Studio بالسعر المتفق عليه. أتعهد بعدم محاولة استرجاع الحساب أو تغييره بعد البيع.'),
(null, 'buy', 'سياسة شراء عامة', 'يجب على العميل مراجعة بيانات الحساب قبل الشراء. بعد استلام الحساب وتغيير بياناته لا يمكن استرجاع المبلغ إلا في حالة وجود مشكلة مثبتة من طرف المتجر.')
on conflict do nothing;


-- V3: مميز / قابل للتفاوض للصفحات القديمة
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='game_accounts' AND column_name='featured') THEN
    ALTER TABLE public.game_accounts ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='game_accounts' AND column_name='negotiable') THEN
    ALTER TABLE public.game_accounts ADD COLUMN negotiable boolean DEFAULT false;
  END IF;
END $$;
