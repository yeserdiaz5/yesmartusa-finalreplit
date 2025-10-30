-- Add more order statuses for complete order management
-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new check constraint with all order lifecycle statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'));

-- No need to update existing orders as 'pending' and 'paid' are still valid
