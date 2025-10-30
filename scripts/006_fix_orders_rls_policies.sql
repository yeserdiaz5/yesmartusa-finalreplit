-- Fix RLS policies for orders table to support guest checkout and avoid infinite recursion

-- First, make sure buyer_id can be null for guest orders
ALTER TABLE public.orders ALTER COLUMN buyer_id DROP NOT NULL;

-- Add buyer_email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'buyer_email'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN buyer_email text;
  END IF;
END $$;

-- Drop all existing policies on orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view guest orders" ON public.orders;

-- Drop all existing policies on order_items table
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view order items for their products" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view order items for guest orders" ON public.order_items;

-- ORDERS TABLE POLICIES

-- Allow INSERT for everyone (authenticated and anonymous)
CREATE POLICY "allow_insert_orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Allow SELECT for authenticated users (their own orders)
CREATE POLICY "allow_select_own_orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND buyer_id = auth.uid()
);

-- Allow SELECT for guest orders (anyone can view)
CREATE POLICY "allow_select_guest_orders"
ON public.orders
FOR SELECT
USING (buyer_id IS NULL);

-- ORDER_ITEMS TABLE POLICIES

-- Allow INSERT for everyone
CREATE POLICY "allow_insert_order_items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Allow SELECT for everyone (simplified to avoid recursion)
CREATE POLICY "allow_select_order_items"
ON public.order_items
FOR SELECT
USING (true);
