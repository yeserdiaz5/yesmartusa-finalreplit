-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create tags table
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamp with time zone default now()
);

-- Create product_categories junction table (many-to-many)
create table if not exists public.product_categories (
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (product_id, category_id),
  created_at timestamp with time zone default now()
);

-- Create product_tags junction table (many-to-many)
create table if not exists public.product_tags (
  product_id uuid references public.products(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (product_id, tag_id),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_tags enable row level security;

-- RLS Policies for categories (public read, admin write)
create policy "Anyone can view active categories"
  on public.categories for select
  using (is_active = true);

create policy "Admins can manage categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for tags (public read, sellers and admins can create)
create policy "Anyone can view tags"
  on public.tags for select
  using (true);

create policy "Sellers can create tags"
  on public.tags for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

-- RLS Policies for product_categories (follow product permissions)
create policy "Anyone can view product categories"
  on public.product_categories for select
  using (true);

create policy "Sellers can manage their product categories"
  on public.product_categories for all
  using (
    exists (
      select 1 from public.products
      where id = product_id and seller_id = auth.uid()
    )
  );

-- RLS Policies for product_tags (follow product permissions)
create policy "Anyone can view product tags"
  on public.product_tags for select
  using (true);

create policy "Sellers can manage their product tags"
  on public.product_tags for all
  using (
    exists (
      select 1 from public.products
      where id = product_id and seller_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists tags_slug_idx on public.tags(slug);
create index if not exists product_categories_product_id_idx on public.product_categories(product_id);
create index if not exists product_categories_category_id_idx on public.product_categories(category_id);
create index if not exists product_tags_product_id_idx on public.product_tags(product_id);
create index if not exists product_tags_tag_id_idx on public.product_tags(tag_id);

-- Insert some default categories
insert into public.categories (name, slug, description) values
  ('Electronics', 'electronics', 'Electronic devices and accessories'),
  ('Clothing', 'clothing', 'Fashion and apparel'),
  ('Home & Garden', 'home-garden', 'Home improvement and garden supplies'),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear'),
  ('Books', 'books', 'Books and reading materials'),
  ('Toys & Games', 'toys-games', 'Toys and games for all ages'),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Beauty products and personal care items'),
  ('Automotive', 'automotive', 'Auto parts and accessories')
on conflict (slug) do nothing;

-- Insert some common tags
insert into public.tags (name, slug) values
  ('New Arrival', 'new-arrival'),
  ('Best Seller', 'best-seller'),
  ('On Sale', 'on-sale'),
  ('Eco-Friendly', 'eco-friendly'),
  ('Premium Quality', 'premium-quality'),
  ('Fast Shipping', 'fast-shipping'),
  ('Limited Edition', 'limited-edition'),
  ('Handmade', 'handmade')
on conflict (slug) do nothing;
