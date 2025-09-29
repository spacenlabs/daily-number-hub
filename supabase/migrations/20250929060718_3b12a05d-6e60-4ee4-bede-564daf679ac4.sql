-- Phase 1b: Create user_permissions table and functions

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