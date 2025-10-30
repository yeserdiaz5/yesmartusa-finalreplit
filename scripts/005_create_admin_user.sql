-- Script to create/update admin user
-- This script will update the role of the user with email yessr2858@gmail.com to admin

-- First, you need to sign up with this email through the app's sign-up page
-- After signing up, run this script to grant admin privileges

-- Update the user role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'yessr2858@gmail.com';

-- Verify the update
SELECT id, email, role, created_at
FROM public.users
WHERE email = 'yessr2858@gmail.com';
