-- Set up authentication system with admin roles
-- 1. Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    );
$$;

-- 5. Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::text 
    FROM public.profiles 
    WHERE user_id = auth.uid();
$$;

-- 6. Create profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 7. Allow authenticated users to insert their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 8. Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Update games table RLS policies to require admin authentication
DROP POLICY IF EXISTS "Games can be updated by anyone (single admin system)" ON public.games;

CREATE POLICY "Only admins can update games"
ON public.games
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 10. Allow admins to insert and delete games
CREATE POLICY "Only admins can insert games"
ON public.games
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete games"
ON public.games
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 11. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        'user'  -- Default role is user, admin role must be manually assigned
    );
    RETURN NEW;
END;
$$;

-- 12. Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 13. Insert a default admin user (you'll need to create this user account)
-- This will be done after the user signs up for the first time
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control. First user to register should be manually promoted to admin role.';