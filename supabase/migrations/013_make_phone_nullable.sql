-- ========================================
-- FECHA10 - Make phone nullable for device-based auth
-- ========================================

ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone SET DEFAULT '';
