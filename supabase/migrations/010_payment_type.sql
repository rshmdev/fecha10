-- ========================================
-- FECHA10 - Add payment_type to participants
-- ========================================

ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'session' CHECK (payment_type IN ('monthly', 'session'));
