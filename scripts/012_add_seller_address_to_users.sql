-- Add seller_address field to users table for storing seller shipping addresses
ALTER TABLE users
ADD COLUMN seller_address JSONB;

COMMENT ON COLUMN users.seller_address IS 'Seller shipping address in JSONB format with fields: full_name, address_line1, address_line2, city, state, postal_code, country, phone';

-- Insert a default seller address for existing sellers (you can update this later)
UPDATE users
SET seller_address = jsonb_build_object(
  'full_name', full_name,
  'address_line1', '123 Seller Street',
  'address_line2', '',
  'city', 'Miami',
  'state', 'FL',
  'postal_code', '33101',
  'country', 'US',
  'phone', COALESCE(phone, '305-555-0100')
)
WHERE role = 'seller' AND seller_address IS NULL;
