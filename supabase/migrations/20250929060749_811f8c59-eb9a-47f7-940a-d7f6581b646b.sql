-- Phase 1B: Create user_permissions table and functions

-- Create user_permissions table for granular permission control
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    permission TEXT NOT NULL,
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, permission)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create enhanced permission checking functions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_permissions 
        WHERE user_id = _user_id 
        AND permission = _permission
        AND (expires_at IS NULL OR expires_at > now())
    );
$$;

-- Create role hierarchy checking function
CREATE OR REPLACE FUNCTION public.has_role_or_higher(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
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

-- Create enhanced is_admin function that includes super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
$$;

-- Create super admin check function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
$$;

-- Create RLS policies for user_permissions table
CREATE POLICY "Super admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (is_super_admin());

CREATE POLICY "Admins can view all permissions" 
ON public.user_permissions 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = auth.uid());

-- Update profiles policies to allow super admins full access
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (is_super_admin());

-- Create function to assign default permissions based on role
CREATE OR REPLACE FUNCTION public.assign_role_permissions(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Clear existing permissions for this user
    DELETE FROM public.user_permissions WHERE user_id = _user_id;
    
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

-- Create trigger to auto-assign permissions when profile role changes
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only assign permissions if role actually changed
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        PERFORM assign_role_permissions(NEW.user_id, NEW.role);
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
    AFTER UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_role_change();

-- Also assign permissions for existing profiles
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN SELECT user_id, role FROM public.profiles LOOP
        PERFORM assign_role_permissions(profile_record.user_id, profile_record.role);
    END LOOP;
END $$;