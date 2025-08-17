-- Grant admin access to the specified user
INSERT INTO public.admin_roles (user_id, role)
SELECT 'f8e955f6-8e95-48c5-8390-debb947cc5c1'::uuid, 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_roles WHERE user_id = 'f8e955f6-8e95-48c5-8390-debb947cc5c1'
);

-- Optionally ensure updated_at reflects the change
UPDATE public.admin_roles
SET updated_at = now()
WHERE user_id = 'f8e955f6-8e95-48c5-8390-debb947cc5c1';