-- Phase 1: Database Schema Changes for User-Specific Game Assignments

-- 1. Add user status and public username to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_username TEXT UNIQUE;

-- 2. Create game_assignments table
CREATE TABLE IF NOT EXISTS public.game_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- 3. Enable RLS on game_assignments
ALTER TABLE public.game_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check game assignments
CREATE OR REPLACE FUNCTION public.has_game_assignment(_user_id UUID, _game_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_assignments 
    WHERE user_id = _user_id AND game_id = _game_id
  )
$$;

-- 5. Create RLS policies for game_assignments table
CREATE POLICY "Users can view their own assignments"
ON public.game_assignments
FOR SELECT
USING (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "Super admins can manage all assignments"
ON public.game_assignments
FOR ALL
USING (is_super_admin());

CREATE POLICY "Admins with manage_games can create assignments"
ON public.game_assignments
FOR INSERT
WITH CHECK (is_admin() OR has_permission(auth.uid(), 'manage_games'));

CREATE POLICY "Admins with manage_games can delete assignments"
ON public.game_assignments
FOR DELETE
USING (is_admin() OR has_permission(auth.uid(), 'manage_games'));

-- 6. Update games table RLS policy for result updates
DROP POLICY IF EXISTS "Users with manage_results permission can update games" ON public.games;

CREATE POLICY "Users can update their assigned games or admins can update all"
ON public.games
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL) AND 
  (is_admin() OR 
   has_permission(auth.uid(), 'manage_results') OR 
   has_game_assignment(auth.uid(), id))
);