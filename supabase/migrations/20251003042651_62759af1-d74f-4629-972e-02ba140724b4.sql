-- Fix infinite recursion in user_roles RLS policies
-- The issue: policies were querying user_roles table directly, causing recursion
-- The fix: use SECURITY DEFINER functions that bypass RLS

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Recreate policies using SECURITY DEFINER functions
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (is_super_admin());

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());