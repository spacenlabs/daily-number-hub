-- Add name fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update the handle_new_user function to include name fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, email, role, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        'user',  -- Default role is user, admin role must be manually assigned
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$function$;

-- Create indexes for better performance on name searches
CREATE INDEX IF NOT EXISTS idx_profiles_names ON public.profiles(first_name, last_name);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.first_name IS 'User first name, can be updated by user or admin';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name, can be updated by user or admin';