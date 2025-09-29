-- Promote lottery2025@gmail.com to Super Admin
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE user_id = '0a315d03-a549-4ffa-b9b8-9c5869e01462' AND email = 'lottery2025@gmail.com';