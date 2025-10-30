-- Add shipping fields to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS shipping_street text,
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_state text,
  ADD COLUMN IF NOT EXISTS shipping_zip text,
  ADD COLUMN IF NOT EXISTS shipping_country text DEFAULT 'USA';

-- Update the shipping_address column to be nullable since we're using individual fields now
ALTER TABLE public.orders 
  ALTER COLUMN shipping_address DROP NOT NULL;
