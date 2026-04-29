-- ========================================
-- FECHA10 - Remove Supabase Auth dependency from profiles
-- ========================================

-- Drop the foreign key constraint that ties profiles to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make phone nullable for device-based auth
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone SET DEFAULT '';
