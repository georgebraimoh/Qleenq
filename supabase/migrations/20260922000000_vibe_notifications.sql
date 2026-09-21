-- Qleenq Vibe Notifications System (Stage 2)
-- Migration: 20260922000000_vibe_notifications.sql

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  hangout_id uuid NOT NULL REFERENCES public.hangouts (id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'vibe_hangout',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_unique UNIQUE (user_id, hangout_id, type)
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Select policy: User can read only their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update policy: User can update (e.g. mark as read) only their own notifications
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant table access
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;

-- Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Database Trigger Function: Notify followers when a new hangout is created
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_vibe_followers_on_hangout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_name text;
BEGIN
  -- Get host's name from profiles table
  SELECT coalesce(name, 'Someone you vibe with') INTO host_name
  FROM public.profiles
  WHERE id = NEW.host_id;

  -- Create a notification for each follower currently vibing with the host
  INSERT INTO public.notifications (
    user_id,
    actor_id,
    hangout_id,
    type,
    title,
    message
  )
  SELECT
    f.follower_id,
    NEW.host_id,
    NEW.id,
    'vibe_hangout',
    'Someone you vibe with is hosting',
    host_name || ' is hosting a new activity: ' || NEW.title
  FROM public.follows f
  WHERE f.following_id = NEW.host_id
  ON CONFLICT (user_id, hangout_id, type) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_hangout_created_notify_followers ON public.hangouts;
CREATE TRIGGER on_hangout_created_notify_followers
  AFTER INSERT ON public.hangouts
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_vibe_followers_on_hangout();
