-- ========================================
-- FECHA10 - Peladas (matches) & Participants tables
-- Run this in the Supabase SQL Editor after 001_profiles.sql
-- ========================================

-- 1. Create peladas table
CREATE TABLE IF NOT EXISTS public.peladas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 18,
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed', 'cancelled')),
  invite_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create participants table (link between peladas and profiles)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id UUID NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'declined', 'pending', 'guest')),
  team TEXT CHECK (team IN ('a', 'b')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'exempt')),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pelada_id, profile_id)
);

-- 3. Enable Row Level Security
ALTER TABLE public.peladas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 4. Policies for peladas
-- Anyone authenticated can read peladas they participate in
CREATE POLICY "Users can read peladas they participate in"
  ON public.peladas
  FOR SELECT
  USING (
    id IN (SELECT pelada_id FROM public.participants WHERE profile_id = auth.uid())
    OR admin_id = auth.uid()
  );

-- Admin can insert peladas
CREATE POLICY "Users can create peladas"
  ON public.peladas
  FOR INSERT
  WITH CHECK (admin_id = auth.uid());

-- Admin can update their own peladas
CREATE POLICY "Admin can update own peladas"
  ON public.peladas
  FOR UPDATE
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Admin can delete their own peladas
CREATE POLICY "Admin can delete own peladas"
  ON public.peladas
  FOR DELETE
  USING (admin_id = auth.uid());

-- 5. Policies for participants
-- Users can read participants of peladas they belong to
CREATE POLICY "Users can read participants of their peladas"
  ON public.participants
  FOR SELECT
  USING (
    pelada_id IN (SELECT id FROM public.peladas WHERE admin_id = auth.uid())
    OR profile_id = auth.uid()
    OR pelada_id IN (SELECT pelada_id FROM public.participants WHERE profile_id = auth.uid())
  );

-- Users can insert themselves as participants (join pelada)
CREATE POLICY "Users can join peladas"
  ON public.participants
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Admin can update participants in their peladas
CREATE POLICY "Admin can update participants in own peladas"
  ON public.participants
  FOR UPDATE
  USING (
    pelada_id IN (SELECT id FROM public.peladas WHERE admin_id = auth.uid())
    OR profile_id = auth.uid()
  );

-- Admin can delete participants from their peladas, or users can remove themselves
CREATE POLICY "Users can leave peladas, admin can remove"
  ON public.participants
  FOR DELETE
  USING (
    profile_id = auth.uid()
    OR pelada_id IN (SELECT id FROM public.peladas WHERE admin_id = auth.uid())
  );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_peladas_admin ON public.peladas(admin_id);
CREATE INDEX IF NOT EXISTS idx_peladas_invite_code ON public.peladas(invite_code);
CREATE INDEX IF NOT EXISTS idx_peladas_date ON public.peladas(date);
CREATE INDEX IF NOT EXISTS idx_participants_pelada ON public.participants(pelada_id);
CREATE INDEX IF NOT EXISTS idx_participants_profile ON public.participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants(status);

-- 7. Auto-add creator as admin participant
CREATE OR REPLACE FUNCTION public.add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.participants (pelada_id, profile_id, status, is_admin, payment_status)
  VALUES (NEW.id, NEW.admin_id, 'confirmed', TRUE, 'exempt');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pelada_created ON public.peladas;
CREATE TRIGGER on_pelada_created
  AFTER INSERT ON public.peladas
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_admin();

-- 8. Function to get next upcoming pelada for a user
CREATE OR REPLACE FUNCTION public.get_next_pelada(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  date DATE,
  start_time TIME,
  end_time TIME,
  max_players INTEGER,
  price DECIMAL,
  image_url TEXT,
  status TEXT,
  invite_code TEXT,
  admin_id UUID,
  confirmed_count BIGINT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.description,
      p.location,
      p.latitude,
      p.longitude,
      p.date,
      p.start_time,
      p.end_time,
      p.max_players,
      p.price,
      p.image_url,
      p.status,
      p.invite_code,
      p.admin_id,
      (SELECT COUNT(*) FROM public.participants pt
       WHERE pt.pelada_id = p.id AND pt.status = 'confirmed') AS confirmed_count
    FROM public.peladas p
    INNER JOIN public.participants pt ON pt.pelada_id = p.id
    WHERE pt.profile_id = user_id
      AND pt.status IN ('confirmed', 'pending')
      AND p.date >= CURRENT_DATE
    ORDER BY p.date ASC, p.start_time ASC
    LIMIT 1;
END;
$$;