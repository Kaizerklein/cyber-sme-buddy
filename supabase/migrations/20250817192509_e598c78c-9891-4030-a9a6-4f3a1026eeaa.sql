-- Recreate function with fixed search_path to satisfy linter
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = user_id_param
  );
$$;

-- Replace recursive policy with function-based policy to avoid recursion
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON public.admin_roles;

CREATE POLICY "Super admins can manage admin roles"
ON public.admin_roles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));