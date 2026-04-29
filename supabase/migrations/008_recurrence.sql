-- ========================================
-- FECHA10 - Add recurrence support to peladas
-- ========================================

-- 1. Add recurrence columns to peladas
ALTER TABLE public.peladas ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'unique' CHECK (recurrence_type IN ('unique', 'weekly'));
ALTER TABLE public.peladas ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[];
ALTER TABLE public.peladas ADD COLUMN IF NOT EXISTS parent_pelada_id UUID REFERENCES public.peladas(id) ON DELETE CASCADE;

-- 2. Add index for parent_pelada_id
CREATE INDEX IF NOT EXISTS idx_peladas_parent ON public.peladas(parent_pelada_id);

-- 3. Function to generate next instance from recurring pelada
CREATE OR REPLACE FUNCTION public.generate_next_recurring_instance(pelada_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  parent_pelada RECORD;
  next_date DATE;
  today_day INTEGER;
  next_day INTEGER;
  days_ahead INTEGER;
  new_instance_id UUID;
  day_of_week INTEGER;
  min_days_ahead INTEGER;
BEGIN
  -- Get parent pelada
  SELECT * INTO parent_pelada FROM public.peladas WHERE id = pelada_id;
  
  IF NOT FOUND OR parent_pelada.recurrence_type != 'weekly' OR parent_pelada.recurrence_days IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next occurrence date
  today_day := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
  min_days_ahead := 999;
  next_day := -1;
  
  -- Find the closest upcoming day (at least 1 day ahead)
  FOREACH day_of_week IN ARRAY parent_pelada.recurrence_days
  LOOP
    IF day_of_week > today_day THEN
      days_ahead := day_of_week - today_day;
      IF days_ahead >= 1 AND days_ahead < min_days_ahead THEN
        min_days_ahead := days_ahead;
        next_day := day_of_week;
      END IF;
    ELSIF day_of_week <= today_day THEN
      -- Next week
      days_ahead := (7 - today_day) + day_of_week;
      IF days_ahead >= 1 AND days_ahead < min_days_ahead THEN
        min_days_ahead := days_ahead;
        next_day := day_of_week;
      END IF;
    END IF;
  END LOOP;
  
  IF next_day = -1 OR min_days_ahead = 999 THEN
    RETURN NULL;
  END IF;
  
  next_date := CURRENT_DATE + (min_days_ahead || ' days')::INTERVAL;
  
  -- Create new instance
  INSERT INTO public.peladas (
    admin_id, name, description, location, latitude, longitude,
    date, start_time, end_time, max_players, price, image_url,
    status, recurrence_type, recurrence_days, parent_pelada_id
  ) VALUES (
    parent_pelada.admin_id, parent_pelada.name, parent_pelada.description,
    parent_pelada.location, parent_pelada.latitude, parent_pelada.longitude,
    next_date, parent_pelada.start_time, parent_pelada.end_time,
    parent_pelada.max_players, parent_pelada.price, parent_pelada.image_url,
    'open', 'unique', NULL, parent_pelada.id
  ) RETURNING id INTO new_instance_id;
  
  -- Copy participants from parent to new instance
  INSERT INTO public.participants (pelada_id, profile_id, status, team, payment_status, payment_type, is_admin)
  SELECT new_instance_id, profile_id, status, team, payment_status, payment_type, is_admin
  FROM public.participants WHERE pelada_id = pelada_id;
  
  RETURN new_instance_id;
END;
$$;

-- 4. Trigger to auto-generate next instance when recurring pelada passes
CREATE OR REPLACE FUNCTION public.check_and_generate_recurring()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_instance_id UUID;
BEGIN
  -- Check if pelada date has passed or status is being set to closed
  IF (NEW.date < CURRENT_DATE OR (NEW.status = 'closed' AND OLD.status != 'closed')) 
     AND OLD.status != 'closed' AND OLD.status != 'cancelled' THEN
    -- If this is a recurring template, generate next instance
    IF OLD.recurrence_type = 'weekly' AND OLD.recurrence_days IS NOT NULL THEN
      next_instance_id := public.generate_next_recurring_instance(OLD.id);
      
      -- If we generated a new instance, copy the status to closed for the old one
      IF next_instance_id IS NOT NULL THEN
        NEW.status := 'closed';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_pelada_date_check ON public.peladas;
CREATE TRIGGER on_pelada_date_check
  BEFORE UPDATE ON public.peladas
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_generate_recurring();
