-- Update orders table to use only 'pending' and 'paid' status
-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new check constraint with only 'pending' and 'paid'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid'));

-- Update existing orders to use new status values
-- Map old statuses to new ones
UPDATE public.orders 
SET status = CASE 
  WHEN status IN ('processing', 'shipped', 'delivered') THEN 'paid'
  WHEN status = 'cancelled' THEN 'pending'
  ELSE status
END
WHERE status NOT IN ('pending', 'paid');

-- Add index for payment_intent_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS orders_payment_intent_id_idx ON public.orders(payment_intent_id);
