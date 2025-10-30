-- Create cart table for persistent shopping cart
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  -- Ensure one cart item per product per user
  unique(user_id, product_id)
);

-- Enable RLS
alter table public.cart_items enable row level security;

-- RLS Policies for cart_items table
-- Users can view their own cart items
create policy "Users can view their own cart items"
  on public.cart_items for select
  using (auth.uid() = user_id);

-- Users can insert their own cart items
create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

-- Users can update their own cart items
create policy "Users can update their own cart items"
  on public.cart_items for update
  using (auth.uid() = user_id);

-- Users can delete their own cart items
create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists cart_items_product_id_idx on public.cart_items(product_id);
