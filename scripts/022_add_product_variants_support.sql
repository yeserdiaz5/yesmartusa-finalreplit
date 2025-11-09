-- Add support for product variants
-- This migration adds parent_id, asin, and attributes columns to enable product variants

-- Add parent_id column (self-referencing foreign key for variants)
alter table public.products
add column if not exists parent_id uuid references public.products(id) on delete cascade;

-- Add asin column (Amazon Standard Identification Number)
alter table public.products
add column if not exists asin text;

-- Add attributes column (JSON for variant attributes like color, size, etc.)
alter table public.products
add column if not exists attributes jsonb default '{}'::jsonb;

-- Add embedding column for image search (if not exists from previous migration)
alter table public.products
add column if not exists embedding vector(1536);

-- Create index on parent_id for faster queries
create index if not exists products_parent_id_idx on public.products(parent_id);

-- Create index on asin for faster lookups
create index if not exists products_asin_idx on public.products(asin);

-- Create index on attributes for JSON queries
create index if not exists products_attributes_idx on public.products using gin(attributes);

-- Add unique constraint on asin (each ASIN should be unique)
-- Note: ASINs are only required for products imported from Amazon
alter table public.products
add constraint products_asin_unique unique (asin) deferrable initially deferred;

-- Add comment to clarify the schema
comment on column public.products.parent_id is 'For product variants: links to the parent product. NULL for parent products.';
comment on column public.products.asin is 'Amazon Standard Identification Number. Unique identifier for Amazon products.';
comment on column public.products.attributes is 'JSON object containing variant attributes (e.g., {"color": "red", "size": "M"})';

-- RLS policies remain the same - variants inherit permissions from parent product via seller_id
