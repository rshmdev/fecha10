-- ========================================
-- FECHA10 - Add pelada_notes table
-- ========================================

-- 1. Create pelada_notes table
CREATE TABLE IF NOT EXISTS public.pelada_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id UUID NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.pelada_notes ENABLE ROW LEVEL SECURITY;

-- 3. Policies for pelada_notes
CREATE POLICY "Users can read notes of their peladas"
  ON public.pelada_notes
  FOR SELECT
  USING (
    pelada_id IN (
      SELECT id FROM public.peladas WHERE admin_id = auth.uid()
    )
    OR author_id = auth.uid()
    OR pelada_id IN (
      SELECT pelada_id FROM public.participants WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Participants can create notes in their peladas"
  ON public.pelada_notes
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND pelada_id IN (
      SELECT id FROM public.peladas WHERE admin_id = auth.uid()
      UNION
      SELECT pelada_id FROM public.participants WHERE profile_id = auth.uid() AND status = 'confirmed'
    )
  );

CREATE POLICY "Authors can delete their own notes"
  ON public.pelada_notes
  FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "Admin can delete notes in their peladas"
  ON public.pelada_notes
  FOR DELETE
  USING (
    pelada_id IN (
      SELECT id FROM public.peladas WHERE admin_id = auth.uid()
    )
  );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_pelada_notes_pelada ON public.pelada_notes(pelada_id);
CREATE INDEX IF NOT EXISTS idx_pelada_notes_author ON public.pelada_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_pelada_notes_created ON public.pelada_notes(created_at DESC);
