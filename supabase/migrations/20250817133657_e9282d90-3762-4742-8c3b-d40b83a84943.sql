-- Fix infinite recursion in admin_roles policies
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can manage admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can view admin roles" ON admin_roles;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_roles 
    WHERE user_id = user_id_param
  );
$$;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own admin role" 
  ON admin_roles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage admin roles" 
  ON admin_roles FOR ALL 
  USING (auth.uid() IN (
    SELECT user_id FROM admin_roles WHERE role = 'admin'
  ));