-- Migration: 20260922010000_hangout_message_notifications.sql
-- 1. Update Vibe Followers Notification Copy
-- 2. Add Space Message Notifications Trigger Function & Trigger

-- Update Vibe Followers Notification Trigger Function with preferred product wording
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
    'New Hangout from someone you vibe with',
    host_name || ' is hosting a new Hangout: ' || NEW.title
  FROM public.follows f
  WHERE f.following_id = NEW.host_id
    AND f.follower_id != NEW.host_id
  ON CONFLICT (user_id, hangout_id, type) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger Function: Notify attendees when a new space message is inserted into public.hangout_messages
CREATE OR REPLACE FUNCTION public.notify_space_message_attendees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  hangout_title text;
BEGIN
  -- Get sender's display name from profiles
  SELECT coalesce(name, 'An attendee') INTO sender_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Get hangout title
  SELECT coalesce(title, 'a Hangout') INTO hangout_title
  FROM public.hangouts
  WHERE id = NEW.hangout_id;

  -- Create or update notification for all current attendees except the sender
  INSERT INTO public.notifications (
    user_id,
    actor_id,
    hangout_id,
    type,
    title,
    message,
    is_read,
    created_at
  )
  SELECT
    a.user_id,
    NEW.user_id,
    NEW.hangout_id,
    'space_message',
    'New message in a Hangout',
    sender_name || ' sent a new message in ' || hangout_title,
    false,
    now()
  FROM public.hangout_attendees a
  WHERE a.hangout_id = NEW.hangout_id
    AND a.user_id != NEW.user_id
  ON CONFLICT (user_id, hangout_id, type)
  DO UPDATE SET
    actor_id = EXCLUDED.actor_id,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    is_read = false,
    created_at = now();

  RETURN NEW;
END;
$$;

-- Create Trigger on public.hangout_messages
DROP TRIGGER IF EXISTS on_space_message_inserted_notify_attendees ON public.hangout_messages;
CREATE TRIGGER on_space_message_inserted_notify_attendees
  AFTER INSERT ON public.hangout_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_space_message_attendees();
