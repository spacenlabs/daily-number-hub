-- Update RLS policy to allow users with manage_results permission to update games
DROP POLICY IF EXISTS "Only admins can update games" ON public.games;

-- Create new policy that checks for manage_results permission
CREATE POLICY "Users with manage_results permission can update games" 
ON public.games 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    is_admin() OR 
    has_permission(auth.uid(), 'manage_results')
  )
);

-- Also ensure insert policy allows result operators to add new games if needed
DROP POLICY IF EXISTS "Only admins can insert games" ON public.games;

CREATE POLICY "Admins and game managers can insert games" 
ON public.games 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    is_admin() OR 
    has_permission(auth.uid(), 'manage_games')
  )
);

-- Keep delete policy admin-only for security
DROP POLICY IF EXISTS "Only admins can delete games" ON public.games;

CREATE POLICY "Only admins can delete games" 
ON public.games 
FOR DELETE 
USING (is_admin());