-- Updated to use correct table names: shipments instead of labels, and users instead of addresses
-- RLS policies for shipping label purchase
-- This allows anonymous and authenticated users to access tables needed for shipping

-- Shipments table policies (this is where shipping labels are stored)
DROP POLICY IF EXISTS "Public can insert shipments" ON shipments;
DROP POLICY IF EXISTS "Public can read shipments" ON shipments;
DROP POLICY IF EXISTS "Public can update shipments" ON shipments;

CREATE POLICY "Public can insert shipments"
ON shipments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can read shipments"
ON shipments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can update shipments"
ON shipments
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Order items policies (needed to fetch products for shipping)
DROP POLICY IF EXISTS "Public can read order items" ON order_items;

CREATE POLICY "Public can read order items"
ON order_items
FOR SELECT
TO anon, authenticated
USING (true);

-- Orders policies (needed to fetch order details)
DROP POLICY IF EXISTS "Public can read orders" ON orders;
DROP POLICY IF EXISTS "Public can update orders" ON orders;

CREATE POLICY "Public can read orders"
ON orders
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can update orders"
ON orders
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Products policies (needed to fetch product details for shipping)
DROP POLICY IF EXISTS "Public can read products" ON products;

CREATE POLICY "Public can read products"
ON products
FOR SELECT
TO anon, authenticated
USING (true);

-- Users policies (needed for seller addresses)
DROP POLICY IF EXISTS "Public can read users" ON users;

CREATE POLICY "Public can read users"
ON users
FOR SELECT
TO anon, authenticated
USING (true);
