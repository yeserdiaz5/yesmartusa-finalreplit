-- Create products table for the marketplace

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  price decimal(10, 2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  category text,
  image_url text,
  images text[], -- Array of image URLs
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.products enable row level security;

-- RLS Policies for products table
-- Anyone can view active products
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

-- Sellers can view their own products (including inactive)
create policy "Sellers can view their own products"
  on public.products for select
  using (
    auth.uid() = seller_id and
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- Sellers can insert their own products
create policy "Sellers can insert products"
  on public.products for insert
  with check (
    auth.uid() = seller_id and
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- Sellers can update their own products
create policy "Sellers can update their own products"
  on public.products for update
  using (
    auth.uid() = seller_id and
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- Sellers can delete their own products
create policy "Sellers can delete their own products"
  on public.products for delete
  using (
    auth.uid() = seller_id and
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- Admins can do everything
create policy "Admins can manage all products"
  on public.products for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create index for faster queries
create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_is_active_idx on public.products(is_active);
