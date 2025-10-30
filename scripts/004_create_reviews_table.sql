-- Create reviews table for product reviews

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(product_id, buyer_id) -- One review per product per buyer
);

-- Enable RLS
alter table public.reviews enable row level security;

-- RLS Policies for reviews table
-- Anyone can view reviews
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

-- Buyers can insert reviews for products they purchased
create policy "Buyers can insert reviews"
  on public.reviews for insert
  with check (
    auth.uid() = buyer_id and
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = reviews.product_id
      and o.buyer_id = auth.uid()
      and o.status = 'delivered'
    )
  );

-- Buyers can update their own reviews
create policy "Buyers can update their own reviews"
  on public.reviews for update
  using (auth.uid() = buyer_id);

-- Buyers can delete their own reviews
create policy "Buyers can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = buyer_id);

-- Admins can manage all reviews
create policy "Admins can manage all reviews"
  on public.reviews for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create indexes
create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_buyer_id_idx on public.reviews(buyer_id);
