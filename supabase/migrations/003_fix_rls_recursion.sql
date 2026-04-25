-- ========================================
-- FECHA10 - Fix infinite recursion in RLS policies
-- Run this in the Supabase SQL Editor
-- ========================================

-- 1. Drop ALL problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can read peladas they participate in" ON public.peladas;
DROP POLICY IF EXISTS "Users can read participants of their peladas" ON public.participants;
DROP POLICY IF EXISTS "Admin can update participants in own peladas" ON public.participants;
DROP POLICY IF EXISTS "Users can leave peladas, admin can remove" ON public.participants;

-- 2. Create SECURITY DEFINER helper functions to break recursion

-- Function: check if user is a participant of a pelada
CREATE OR REPLACE FUNCTION public.is_pelada_participant(pelada_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.participants
    WHERE pelada_id = pelada_uuid AND profile_id = user_uuid
  );
END;
$$;

-- Function: check if user is admin of a pelada
CREATE OR REPLACE FUNCTION public.is_pelada_admin(pelada_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.peladas
    WHERE id = pelada_uuid AND admin_id = user_uuid
  );
END;
$$;

-- Function: get all pelada IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_pelada_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT pelada_id FROM public.participants
    WHERE profile_id = user_uuid;
END;
$$;

-- 3. Re-create policies using SECURITY DEFINER functions (no recursion)

-- Peladas: users can read peladas they participate in or admin
CREATE POLICY "Users can read peladas they participate in"
  ON public.peladas
  FOR SELECT
  USING (
    id IN (SELECT public.get_user_pelada_ids(auth.uid()))
    OR admin_id = auth.uid()
  );

-- Participants: users can read participants of peladas they belong to
CREATE POLICY "Users can read participants of their peladas"
  ON public.participants
  FOR SELECT
  USING (
    public.is_pelada_admin(pelada_id, auth.uid())
    OR profile_id = auth.uid()
    OR pelada_id IN (SELECT public.get_user_pelada_ids(auth.uid()))
  );

-- Participants: admin can update participants in their peladas
CREATE POLICY "Admin can update participants in own peladas"
  ON public.participants
  FOR UPDATE
  USING (
    public.is_pelada_admin(pelada_id, auth.uid())
    OR profile_id = auth.uid()
  )
  WITH CHECK (
    public.is_pelada_admin(pelada_id, auth.uid())
    OR profile_id = auth.uid()
  );

-- Participants: users can leave peladas, admin can remove
CREATE POLICY "Users can leave peladas, admin can remove"
  ON public.participants
  FOR DELETE
  USING (
    profile_id = auth.uid()
    OR public.is_pelada_admin(pelada_id, auth.uid())
  );