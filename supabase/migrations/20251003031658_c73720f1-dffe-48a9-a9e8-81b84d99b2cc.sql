-- Phase 1: Critical Security Fixes

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'user',
    assigned_by uuid REFERENCES auth.users(id),
    assigned_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = _user_id 
        AND role = _role
    );
$$;

-- 3. Update existing security definer functions to use user_roles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::text 
    FROM public.user_roles 
    WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = _user_id 
        AND (
            (role = 'super_admin') OR
            (role = 'admin' AND _role IN ('admin', 'game_manager', 'content_manager', 'result_operator', 'viewer')) OR
            (role = 'game_manager' AND _role IN ('game_manager', 'result_operator', 'viewer')) OR
            (role = 'content_manager' AND _role IN ('content_manager', 'viewer')) OR
            (role = 'result_operator' AND _role IN ('result_operator', 'viewer')) OR
            (role = _role)
        )
    );
$$;

-- 4. Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT user_id, role, created_at
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 5. Create RLS policies for user_roles table
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
);

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 6. Update profiles RLS policies to remove role-based exposure
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Only super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- Only super admins can update all profiles (excluding self which is covered by another policy)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- 7. Update assign_role_permissions function to use user_roles
CREATE OR REPLACE FUNCTION public.assign_role_permissions(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Clear existing permissions for this user
    DELETE FROM public.user_permissions WHERE user_id = _user_id;
    
    -- Upsert role in user_roles table
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (_user_id, _role, auth.uid())
    ON CONFLICT (user_id) 
    DO UPDATE SET role = _role, assigned_by = auth.uid(), updated_at = now();
    
    -- Assign permissions based on role
    CASE _role
        WHEN 'super_admin' THEN
            INSERT INTO public.user_permissions (user_id, permission, granted_by) VALUES
            (_user_id, 'manage_users', auth.uid()),
            (_user_id, 'manage_games', auth.uid()),
            (_user_id, 'manage_results', auth.uid()),
            (_user_id, 'manage_content', auth.uid()),
            (_user_id, 'view_analytics', auth.uid()),
            (_user_id, 'manage_settings', auth.uid());
            
        WHEN 'admin' THEN
            INSERT INTO public.user_permissions (user_id, permission, granted_by) VALUES
            (_user_id, 'manage_games', auth.uid()),
            (_user_id, 'manage_results', auth.uid()),
            (_user_id, 'manage_content', auth.uid()),
            (_user_id, 'view_analytics', auth.uid());
            
        WHEN 'game_manager' THEN
            INSERT INTO public.user_permissions (user_id, permission, granted_by) VALUES
            (_user_id, 'manage_games', auth.uid()),
            (_user_id, 'manage_results', auth.uid()),
            (_user_id, 'view_analytics', auth.uid());
            
        WHEN 'content_manager' THEN
            INSERT INTO public.user_permissions (user_id, permission, granted_by) VALUES
            (_user_id, 'manage_content', auth.uid()),
            (_user_id, 'view_analytics', auth.uid());
            
        WHEN 'result_operator' THEN
            INSERT INTO public.user_permissions (user_id, permission, granted_by) VALUES
            (_user_id, 'manage_results', auth.uid());
            
        WHEN 'viewer' THEN
            INSERT INTO public.user_permissions (user_id, permission, granted_by) VALUES
            (_user_id, 'view_analytics', auth.uid());
            
        ELSE
            -- Default user role gets no special permissions
            NULL;
    END CASE;
END;
$$;

-- 8. Create trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Update handle_new_user to create role in user_roles instead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile without role
    INSERT INTO public.profiles (user_id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    
    -- Insert default role in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- 10. Remove role column from profiles table (last step after code is updated)
-- This will be done in a follow-up migration after application code is updated
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;