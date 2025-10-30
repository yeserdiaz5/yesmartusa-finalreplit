-- Update orders table to support guest checkout

-- First, drop existing RLS policies that cause infinite recursion
drop policy if exists "Buyers can view their own orders" on public.orders;
drop policy if exists "Buyers can insert their own orders" on public.orders;
drop policy if exists "Buyers can update their own orders" on public.orders;
drop policy if exists "Sellers can view orders with their products" on public.orders;
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Users can view their order items" on public.order_items;
drop policy if exists "Sellers can view their order items" on public.order_items;
drop policy if exists "Authenticated users can insert order items" on public.order_items;
drop policy if exists "Admins can manage all order items" on public.order_items;

-- Make buyer_id nullable to support guest orders
alter table public.orders alter column buyer_id drop not null;

-- Add buyer_email for guest orders
alter table public.orders add column if not exists buyer_email text;

-- Add constraint: either buyer_id or buyer_email must be present
alter table public.orders add constraint orders_buyer_check 
  check (buyer_id is not null or buyer_email is not null);

-- Create simplified RLS policies for orders table

-- Allow anyone to insert orders (both authenticated users and guests)
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

-- Authenticated users can view their own orders
create policy "Users can view their own orders"
  on public.orders for select
  using (
    (auth.uid() is not null and auth.uid() = buyer_id)
    or
    (auth.uid() is null and buyer_email is not null)
  );

-- Authenticated users can update their own orders
create policy "Users can update their own orders"
  on public.orders for update
  using (auth.uid() is not null and auth.uid() = buyer_id);

-- Sellers can view orders containing their products (simplified to avoid recursion)
create policy "Sellers can view their orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.order_items oi
      where oi.order_id = orders.id and oi.seller_id = auth.uid()
    )
  );

-- Create simplified RLS policies for order_items table

-- Allow anyone to insert order items (will be validated by application logic)
create policy "Anyone can create order items"
  on public.order_items for insert
  with check (true);

-- Users can view order items for their orders
create policy "Users can view order items for their orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id 
      and (o.buyer_id = auth.uid() or auth.uid() is null)
    )
  );

-- Sellers can view their own order items
create policy "Sellers can view their own order items"
  on public.order_items for select
  using (seller_id = auth.uid());

-- Create index for buyer_email
create index if not exists orders_buyer_email_idx on public.orders(buyer_email);
