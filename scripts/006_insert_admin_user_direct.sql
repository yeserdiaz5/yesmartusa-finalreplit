-- Alternative: Direct insert if you want to create the user manually
-- Note: This requires you to get the auth.uid from Supabase Auth first

-- Step 1: Sign up through the app with email: yessr2858@gmail.com and password: Admin1234*
-- Step 2: After signup, the trigger will create a user profile with 'buyer' role by default
-- Step 3: Run script 005_create_admin_user.sql to update the role to 'admin'

-- OR if you want to insert directly (requires auth.uid):
-- INSERT INTO public.users (id, email, role, full_name)
-- VALUES (
--   'YOUR_AUTH_UID_HERE', -- Get this from auth.users after signup
--   'yessr2858@gmail.com',
--   'admin',
--   'Admin User'
-- )
-- ON CONFLICT (id) 
-- DO UPDATE SET role = 'admin';
