-- Drop the deny policy for anonymous users
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Drop existing public policy if it exists
DROP POLICY IF EXISTS "Public profiles are viewable by username" ON public.profiles;

-- Allow anonymous users to view active public profiles
CREATE POLICY "Allow anonymous view of public profiles"
ON public.profiles
FOR SELECT
TO anon
USING (public_username IS NOT NULL AND is_active = true);

-- Drop and recreate game assignments policy for anonymous users
DROP POLICY IF EXISTS "Anonymous can view assignments for active public profiles" ON public.game_assignments;

CREATE POLICY "Allow anonymous view of public game assignments"
ON public.game_assignments
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = game_assignments.user_id
    AND profiles.is_active = true
    AND profiles.public_username IS NOT NULL
  )
);