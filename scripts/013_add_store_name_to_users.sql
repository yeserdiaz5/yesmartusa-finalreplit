-- Add store_name field to users table for seller store names
ALTER TABLE users
ADD COLUMN store_name TEXT;

COMMENT ON COLUMN users.store_name IS 'Store name for sellers (e.g., "TechGear Pro", "Fashion Boutique")';
