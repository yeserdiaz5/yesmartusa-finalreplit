-- Add label_url and tracking_url to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS label_url text,
ADD COLUMN IF NOT EXISTS tracking_url text;

-- Add comment
COMMENT ON COLUMN public.shipments.label_url IS 'URL to download the shipping label PDF';
COMMENT ON COLUMN public.shipments.tracking_url IS 'URL to track the shipment';
