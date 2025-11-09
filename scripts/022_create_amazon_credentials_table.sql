-- Create amazon_credentials table to store Amazon SP-API OAuth tokens
-- Supports multiple Amazon accounts per seller (different marketplaces)
CREATE TABLE IF NOT EXISTS amazon_credentials (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selling_partner_id VARCHAR NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted at application level
  refresh_token TEXT NOT NULL, -- Encrypted at application level
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  marketplace_id VARCHAR NOT NULL DEFAULT 'ATVPDKIKX0DER',
  region VARCHAR NOT NULL DEFAULT 'na', -- 'na', 'eu', or 'fe'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, marketplace_id) -- Allow multiple accounts per seller
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_amazon_credentials_user_id ON amazon_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_amazon_credentials_selling_partner_id ON amazon_credentials(selling_partner_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_amazon_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_amazon_credentials_timestamp
  BEFORE UPDATE ON amazon_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_amazon_credentials_updated_at();

-- Add comment
COMMENT ON TABLE amazon_credentials IS 'Stores Amazon SP-API OAuth credentials (encrypted) for sellers to import their Amazon listings. Supports multiple Amazon accounts per seller.';
