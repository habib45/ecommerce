-- Create Admin User (SQL Approach)
-- This approach requires you to create the auth user in Supabase dashboard first,
-- then run this SQL to update the profile to admin.
--
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → Create a new user with email/password
-- 3. Get the user ID from the list
-- 4. Run the SQL below, replacing 'USER_ID' with the actual user ID

-- Method 1: If you know the user ID
-- UPDATE public.profiles
-- SET role = 'administrator'
-- WHERE id = 'USER_ID';

-- Method 2: If you know the email address
UPDATE public.profiles
SET role = 'administrator'
WHERE email = 'habib.cst@gmail.com';

-- Verify the update
SELECT id, email, full_name, role FROM public.profiles
WHERE role = 'administrator';
