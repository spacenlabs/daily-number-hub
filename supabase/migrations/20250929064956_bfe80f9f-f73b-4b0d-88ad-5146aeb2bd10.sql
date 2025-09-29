-- Fix profiles table RLS policies to prevent public access to email addresses
-- Drop existing policies and recreate them with more explicit security

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policies with explicit authentication requirements

-- Super admins have full access
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Admins can view and update all profiles (but not delete or insert)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Users can only access their own profile data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Explicitly deny all access to anonymous users
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles table with strict RLS policies to prevent email harvesting. Only authenticated users can access their own data, admins can view all profiles.';