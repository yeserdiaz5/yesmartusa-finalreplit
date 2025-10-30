-- Fix infinite recursion in users table RLS policies
-- This script drops the problematic "Admins can view all users" policy
-- that was causing infinite recursion

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- The remaining policies allow users to view/update their own profiles
-- Admin access should be handled at the application level using service role key

-- Verify current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
