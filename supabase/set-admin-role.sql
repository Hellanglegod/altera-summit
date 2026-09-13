-- SQL to assign Super Admin role to your user
-- Replace 'your-email@example.com' with the email you signed up with in Supabase

UPDATE auth.users
SET
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
WHERE email = 'your-email@example.com'; -- <-- Replace this with your actual email!

-- Verify the role was set:
SELECT id, email, raw_app_meta_data->>'role' as app_role, raw_user_meta_data->>'role' as user_role
FROM auth.users;
