-- Script to set yessr2858@gmail.com as admin
-- Run this script after the user has signed up

-- Update the user's role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'yessr2858@gmail.com';

-- Verify the update
SELECT id, email, role, created_at
FROM public.users
WHERE email = 'yessr2858@gmail.com';
