-- Add admin role for airealbro@gmail.com
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'airealbro@gmail.com'
ON CONFLICT (user_id) DO NOTHING;