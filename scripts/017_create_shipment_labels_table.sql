-- Create shipment_labels table for storing PDF backups of shipping labels
CREATE TABLE IF NOT EXISTS public.shipment_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  file_bytes bytea NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL DEFAULT 'application/pdf',
  tracking_number text NOT NULL,
  shippo_label_url text,
  source text NOT NULL DEFAULT 'shippo' CHECK (source IN ('shippo', 'manual', 'other')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shipment_labels_shipment_id ON public.shipment_labels(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_labels_tracking_number ON public.shipment_labels(tracking_number);

-- Create unique constraint to prevent duplicate labels per shipment
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipment_labels_unique_shipment ON public.shipment_labels(shipment_id);

-- Add label_backup_id to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS label_backup_id uuid REFERENCES public.shipment_labels(id) ON DELETE SET NULL;

-- Add index for label_backup_id
CREATE INDEX IF NOT EXISTS idx_shipments_label_backup_id ON public.shipments(label_backup_id);

-- Enable RLS
ALTER TABLE public.shipment_labels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own shipment labels" ON public.shipment_labels;
DROP POLICY IF EXISTS "Sellers can view labels for their shipments" ON public.shipment_labels;
DROP POLICY IF EXISTS "Sellers can create labels" ON public.shipment_labels;
DROP POLICY IF EXISTS "Sellers can update labels" ON public.shipment_labels;

-- RLS Policies - Users can view labels for their own orders
CREATE POLICY "Users can view their own shipment labels"
  ON public.shipment_labels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.orders o ON s.order_id = o.id
      WHERE s.id = shipment_labels.shipment_id
      AND o.buyer_id = auth.uid()
    )
  );

-- Sellers can view labels for shipments of their orders
CREATE POLICY "Sellers can view labels for their shipments"
  ON public.shipment_labels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.order_items oi ON oi.order_id = s.order_id
      JOIN public.products p ON oi.product_id = p.id
      WHERE s.id = shipment_labels.shipment_id
      AND p.seller_id = auth.uid()
    )
  );

-- Sellers can create labels for their shipments
CREATE POLICY "Sellers can create labels"
  ON public.shipment_labels
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.order_items oi ON oi.order_id = s.order_id
      JOIN public.products p ON oi.product_id = p.id
      WHERE s.id = shipment_labels.shipment_id
      AND p.seller_id = auth.uid()
    )
  );

-- Sellers can update labels for their shipments
CREATE POLICY "Sellers can update labels"
  ON public.shipment_labels
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.order_items oi ON oi.order_id = s.order_id
      JOIN public.products p ON oi.product_id = p.id
      WHERE s.id = shipment_labels.shipment_id
      AND p.seller_id = auth.uid()
    )
  );

-- Enable Realtime for shipment_labels
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_labels;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipment_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_shipment_labels_updated_at_trigger ON public.shipment_labels;
CREATE TRIGGER update_shipment_labels_updated_at_trigger
  BEFORE UPDATE ON public.shipment_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_shipment_labels_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.shipment_labels IS 'Stores PDF backups of shipping labels for permanent access';
COMMENT ON COLUMN public.shipment_labels.file_bytes IS 'PDF file stored as binary data';
COMMENT ON COLUMN public.shipment_labels.file_size IS 'Size of the PDF file in bytes';
COMMENT ON COLUMN public.shipment_labels.shippo_label_url IS 'Original Shippo URL (may expire)';
COMMENT ON COLUMN public.shipment_labels.source IS 'Source of the label: shippo, manual, or other';
