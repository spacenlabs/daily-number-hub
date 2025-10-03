-- Set up permanent super admin for support@spacenlabs.com
UPDATE public.user_roles 
SET role = 'super_admin', 
    updated_at = now()
WHERE user_id = '2c5d1855-e983-42b8-8b90-ee5564ab1d14';

-- Assign super admin permissions
SELECT assign_role_permissions('2c5d1855-e983-42b8-8b90-ee5564ab1d14'::uuid, 'super_admin'::app_role);

-- Update password for support@spacenlabs.com using auth admin
-- Note: This sets the password to 'Vesh@1984'
UPDATE auth.users 
SET encrypted_password = crypt('Vesh@1984', gen_salt('bf'))
WHERE id = '2c5d1855-e983-42b8-8b90-ee5564ab1d14';