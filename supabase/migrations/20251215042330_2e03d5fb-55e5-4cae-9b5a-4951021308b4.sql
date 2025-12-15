-- Insert all existing users as admins (skip if already exists)
INSERT INTO public.admin_roles (user_id, role)
SELECT user_id, 'admin'
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.admin_roles);