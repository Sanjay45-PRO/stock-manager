-- ============================================================
-- Stock Management App — Supabase Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- 1. PROFILES (extends auth.users with role info)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. CATEGORIES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- 3. PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  unit_price numeric(12,2) not null default 0,
  unit text not null default 'pcs' check (unit in ('pcs', 'kg', 'g', 'l', 'ml', 'box')),
  quantity integer not null default 0,
  reorder_threshold integer not null default 10,
  image_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. STOCK MOVEMENTS (audit trail — quantity is derived from this + adjusted on products)
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity integer not null,           -- always positive; sign implied by type
  reason text,                          -- e.g. 'Purchase', 'Sale', 'Damaged', 'Correction'
  performed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 5. Keep products.quantity in sync when a movement is inserted
create or replace function apply_stock_movement()
returns trigger as $$
begin
  if new.type = 'in' then
    update products set quantity = quantity + new.quantity, updated_at = now() where id = new.product_id;
  elsif new.type = 'out' then
    update products set quantity = greatest(quantity - new.quantity, 0), updated_at = now() where id = new.product_id;
  elsif new.type = 'adjustment' then
    update products set quantity = new.quantity, updated_at = now() where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_stock_movement_insert on stock_movements;
create trigger on_stock_movement_insert
  after insert on stock_movements
  for each row execute procedure apply_stock_movement();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table stock_movements enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Profiles: everyone signed in can read; only admins can edit roles
create policy "profiles_select_all" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_update_self_or_admin" on profiles for update
  using (auth.uid() = id or is_admin());

-- Categories: all authenticated users can read; only admins can write
create policy "categories_select_all" on categories for select using (auth.role() = 'authenticated');
create policy "categories_write_admin" on categories for insert with check (is_admin());
create policy "categories_update_admin" on categories for update using (is_admin());
create policy "categories_delete_admin" on categories for delete using (is_admin());

-- Products: all authenticated users can read; only admins can create/delete, staff can update stock-related fields via movements only
create policy "products_select_all" on products for select using (auth.role() = 'authenticated');
create policy "products_insert_admin" on products for insert with check (is_admin());
create policy "products_update_admin" on products for update using (is_admin());
create policy "products_delete_admin" on products for delete using (is_admin());

-- Stock movements: all authenticated users can read + insert (staff log stock in/out); no one edits/deletes history
create policy "movements_select_all" on stock_movements for select using (auth.role() = 'authenticated');
create policy "movements_insert_all" on stock_movements for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Seed a couple of categories (optional)
-- ============================================================
insert into categories (name) values ('General'), ('Electronics'), ('Packaging')
on conflict (name) do nothing;
