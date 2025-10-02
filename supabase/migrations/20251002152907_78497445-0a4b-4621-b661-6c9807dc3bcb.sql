-- Create migration_backups table for storing game states before migration
CREATE TABLE IF NOT EXISTS public.migration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  restored BOOLEAN NOT NULL DEFAULT false,
  restored_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.migration_backups ENABLE ROW LEVEL SECURITY;

-- Only admins can view migration backups
CREATE POLICY "Admins can view migration backups"
ON public.migration_backups
FOR SELECT
USING (is_admin());

-- Only admins can create migration backups
CREATE POLICY "Admins can create migration backups"
ON public.migration_backups
FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update migration backups (for marking as restored)
CREATE POLICY "Admins can update migration backups"
ON public.migration_backups
FOR UPDATE
USING (is_admin());

-- Create index for faster queries
CREATE INDEX idx_migration_backups_created_at ON public.migration_backups(created_at DESC);
CREATE INDEX idx_migration_backups_restored ON public.migration_backups(restored);