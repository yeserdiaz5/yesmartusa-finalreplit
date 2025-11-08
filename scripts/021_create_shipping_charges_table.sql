-- Create shipping_charges table to track shipping costs owed by sellers
-- This table records when sellers need to pay for shipping (seller_pays or shared policies)

CREATE TABLE IF NOT EXISTS shipping_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('seller_pays', 'shared', 'buyer_pays')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deducted', 'cancelled')),
  deducted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_shipping_charges_seller_id ON shipping_charges(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipping_charges_order_id ON shipping_charges(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_charges_status ON shipping_charges(status);

-- Add comments
COMMENT ON TABLE shipping_charges IS 'Tracks shipping costs that sellers owe for their orders';
COMMENT ON COLUMN shipping_charges.seller_id IS 'The seller who owes the shipping cost';
COMMENT ON COLUMN shipping_charges.order_id IS 'The order associated with this shipping charge';
COMMENT ON COLUMN shipping_charges.amount IS 'The amount in USD that the seller owes';
COMMENT ON COLUMN shipping_charges.type IS 'Type of shipping payment: seller_pays (100%), shared (50%), buyer_pays (0%)';
COMMENT ON COLUMN shipping_charges.status IS 'Status of the charge: pending, deducted, or cancelled';
COMMENT ON COLUMN shipping_charges.deducted_at IS 'When the amount was deducted from seller payout';

-- Enable Row Level Security
ALTER TABLE shipping_charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Sellers can view their own shipping charges
CREATE POLICY "Sellers can view own shipping charges" ON shipping_charges
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Platform admins can view all shipping charges
CREATE POLICY "Admins can view all shipping charges" ON shipping_charges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only the system (service role) can insert shipping charges
CREATE POLICY "System can insert shipping charges" ON shipping_charges
  FOR INSERT
  WITH CHECK (true);

-- Only the system (service role) can update shipping charges
CREATE POLICY "System can update shipping charges" ON shipping_charges
  FOR UPDATE
  USING (true);
