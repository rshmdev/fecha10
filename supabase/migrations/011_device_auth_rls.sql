-- ========================================
-- FECHA10 - Adjust RLS policies for device-based auth
-- Profiles now use device_id as primary key (no Supabase Auth)
-- ========================================

-- 1. Allow anyone to create their own profile (device-based)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;

-- Since we don't use Supabase Auth, we need to allow anonymous access for profile creation
-- and rely on application-level security. In production, consider using a custom JWT approach.

-- Allow anyone to insert profiles (first-time onboarding)
CREATE POLICY "Anyone can create a profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read profiles (needed for displaying participant info)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow profile updates by the profile owner (application-level check)
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 2. Adjust peladas policies to allow device-based access
-- Keep existing policies but add anonymous read for invite code lookups
DROP POLICY IF EXISTS "Users can read peladas they participate in" ON public.peladas;

CREATE POLICY "Users can read peladas they participate in"
  ON public.peladas
  FOR SELECT
  USING (
    id IN (SELECT pelada_id FROM public.participants WHERE profile_id = auth.uid())
    OR admin_id = auth.uid()
    OR invite_code IS NOT NULL  -- Allow reading by invite code (join flow)
  );

-- 3. Adjust notifications table policies
-- The notifications table uses user_id which now maps to device_id
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Anyone can read notifications"
  ON public.notifications
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update notifications"
  ON public.notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);
