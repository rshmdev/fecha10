-- ========================================
-- FECHA10 - Payments table
-- Run this in the Supabase SQL Editor
-- ========================================

-- 1. Create payments table
-- Two types: 'monthly' (recurring) and 'session' (one-time for a specific date)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id UUID NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'session' CHECK (payment_type IN ('monthly', 'session')),
  -- For monthly: reference_month like '2025-01'. For session: the specific date
  reference_month TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pelada_id, profile_id, payment_type, reference_month)
);

-- 2. Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Policies for payments
-- Admin can read all payments for their peladas
-- Participants can read their own payments
CREATE POLICY "Users can read payments for their peladas"
  ON public.payments
  FOR SELECT
  USING (
    pelada_id IN (SELECT public.get_user_pelada_ids(auth.uid()))
    OR public.is_pelada_admin(pelada_id, auth.uid())
  );

-- Admin can insert payments for their peladas
CREATE POLICY "Admin can insert payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (public.is_pelada_admin(pelada_id, auth.uid()));

-- Admin can update payments for their peladas
CREATE POLICY "Admin can update payments"
  ON public.payments
  FOR UPDATE
  USING (public.is_pelada_admin(pelada_id, auth.uid()))
  WITH CHECK (public.is_pelada_admin(pelada_id, auth.uid()));

-- Admin can delete payments for their peladas
CREATE POLICY "Admin can delete payments"
  ON public.payments
  FOR DELETE
  USING (public.is_pelada_admin(pelada_id, auth.uid()));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_payments_pelada ON public.payments(pelada_id);
CREATE INDEX IF NOT EXISTS idx_payments_profile ON public.payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);

-- 5. Add payment_type to participants (monthly vs session participant)
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'session' CHECK (payment_type IN ('monthly', 'session'));