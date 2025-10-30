-- Add shipping and cancellation fields to orders table
-- Use DO block to handle errors gracefully

DO $$ 
BEGIN
  -- Add tracking_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
  END IF;

  -- Add shipping_carrier column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'shipping_carrier'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN shipping_carrier TEXT;
  END IF;

  -- Add cancellation_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- Update status constraint to include shipped and cancelled
-- First, update any existing orders with old statuses
UPDATE public.orders 
SET status = CASE 
  WHEN status = 'processing' THEN 'paid'
  WHEN status = 'delivered' THEN 'shipped'
  ELSE status
END
WHERE status IN ('processing', 'delivered');

-- Drop and recreate the constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled'));

-- Add comments for documentation
COMMENT ON COLUMN public.orders.tracking_number IS 'Tracking number for shipped orders';
COMMENT ON COLUMN public.orders.shipping_carrier IS 'Shipping carrier/company name (USPS, FedEx, UPS, DHL, etc.)';
COMMENT ON COLUMN public.orders.cancellation_reason IS 'Reason for order cancellation';
