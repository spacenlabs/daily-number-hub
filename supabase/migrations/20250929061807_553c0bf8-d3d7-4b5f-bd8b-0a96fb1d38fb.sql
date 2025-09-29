-- Force refresh of permissions by updating timestamps
UPDATE public.user_permissions 
SET granted_at = now()
WHERE user_id = '0a315d03-a549-4ffa-b9b8-9c5869e01462';