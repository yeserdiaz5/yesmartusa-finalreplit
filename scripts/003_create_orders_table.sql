-- Create orders and order_items tables

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount decimal(10, 2) not null check (total_amount >= 0),
  shipping_address jsonb not null,
  payment_intent_id text, -- Stripe payment intent ID
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  seller_id uuid not null references public.users(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  price_at_purchase decimal(10, 2) not null check (price_at_purchase >= 0),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- RLS Policies for orders table
-- Buyers can view their own orders
create policy "Buyers can view their own orders"
  on public.orders for select
  using (auth.uid() = buyer_id);

-- Buyers can insert their own orders
create policy "Buyers can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id);

-- Buyers can update their own orders (for cancellation)
create policy "Buyers can update their own orders"
  on public.orders for update
  using (auth.uid() = buyer_id);

-- Sellers can view orders containing their products
create policy "Sellers can view orders with their products"
  on public.orders for select
  using (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id = auth.uid()
    ) and
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- Admins can view all orders
create policy "Admins can view all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for order_items table
-- Users can view order items for their orders
create policy "Users can view their order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and buyer_id = auth.uid()
    )
  );

-- Sellers can view order items for their products
create policy "Sellers can view their order items"
  on public.order_items for select
  using (
    auth.uid() = seller_id and
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- System can insert order items (through server actions)
create policy "Authenticated users can insert order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and buyer_id = auth.uid()
    )
  );

-- Admins can manage all order items
create policy "Admins can manage all order items"
  on public.order_items for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create indexes for faster queries
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists order_items_seller_id_idx on public.order_items(seller_id);
