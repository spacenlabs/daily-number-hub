-- Allow anonymous users to view active public profiles by username
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Allow anonymous users to view profiles with public_username (for public pages)
CREATE POLICY "Public profiles are viewable by username"
ON public.profiles
FOR SELECT
TO anon
USING (public_username IS NOT NULL AND is_active = true);

-- Allow anonymous users to view game assignments for public profiles
CREATE POLICY "Anonymous can view assignments for active public profiles"
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