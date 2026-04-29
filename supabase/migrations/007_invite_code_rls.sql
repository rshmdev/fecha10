-- Allow authenticated users to read peladas by invite code
-- This is needed for the join flow: a user with an invite code
-- should be able to see the pelada they're invited to, even if
-- they're not yet a participant.
CREATE POLICY "Users can read peladas by invite code"
  ON public.peladas
  FOR SELECT
  USING (invite_code IS NOT NULL);

-- Allow reading participants of peladas visible by invite code
CREATE POLICY "Users can read participants of peladas visible by invite code"
  ON public.participants
  FOR SELECT
  USING (
    pelada_id IN (SELECT id FROM public.peladas WHERE invite_code IS NOT NULL)
  );