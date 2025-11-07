-- Add Stripe Connect columns to users table
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_account_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups by Stripe account ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_account 
ON public.users(stripe_connect_account_id);
