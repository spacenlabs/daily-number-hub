-- Phase 1A: Add new enum values (must be in separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'game_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'result_operator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';