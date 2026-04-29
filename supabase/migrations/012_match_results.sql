-- ========================================
-- FECHA10 - Add match results (placar) support
-- Multiple short matches per pelada
-- ========================================

-- 1. Create match_results table
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id UUID NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  team_a_name TEXT NOT NULL DEFAULT 'Time A',
  team_b_name TEXT NOT NULL DEFAULT 'Time B',
  team_a_score INTEGER NOT NULL DEFAULT 0,
  team_b_score INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Anyone can read match results"
  ON public.match_results
  FOR SELECT
  USING (true);

CREATE POLICY "Participants can create match results"
  ON public.match_results
  FOR INSERT
  WITH CHECK (
    pelada_id IN (
      SELECT id FROM public.peladas WHERE admin_id = auth.uid()
      UNION
      SELECT pelada_id FROM public.participants WHERE profile_id = auth.uid() AND status = 'confirmed'
    )
  );

CREATE POLICY "Admin can delete match results"
  ON public.match_results
  FOR DELETE
  USING (
    pelada_id IN (
      SELECT id FROM public.peladas WHERE admin_id = auth.uid()
    )
  );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_match_results_pelada ON public.match_results(pelada_id);
CREATE INDEX IF NOT EXISTS idx_match_results_created ON public.match_results(created_at DESC);
