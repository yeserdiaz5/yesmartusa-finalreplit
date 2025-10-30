-- Create shipments table for tracking order shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  carrier text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed', 'returned')),
  shipped_at timestamptz DEFAULT now(),
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own order shipments" ON public.shipments;
DROP POLICY IF EXISTS "Sellers can view shipments for their orders" ON public.shipments;
DROP POLICY IF EXISTS "Sellers can create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Sellers can update shipments" ON public.shipments;

-- RLS Policies
-- Users can view shipments for their own orders
CREATE POLICY "Users can view their own order shipments"
  ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Sellers can view shipments for orders containing their products
CREATE POLICY "Sellers can view shipments for their orders"
  ON public.shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON oi.product_id = p.id
      WHERE oi.order_id = shipments.order_id
      AND p.seller_id = auth.uid()
    )
  );

-- Sellers can create shipments for their orders
CREATE POLICY "Sellers can create shipments"
  ON public.shipments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON oi.product_id = p.id
      WHERE oi.order_id = shipments.order_id
      AND p.seller_id = auth.uid()
    )
  );

-- Sellers can update shipments for their orders
CREATE POLICY "Sellers can update shipments"
  ON public.shipments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON oi.product_id = p.id
      WHERE oi.order_id = shipments.order_id
      AND p.seller_id = auth.uid()
    )
  );

-- Enable Realtime for shipments
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_shipments_updated_at_trigger ON public.shipments;
CREATE TRIGGER update_shipments_updated_at_trigger
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();
