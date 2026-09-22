-- Migration: 20260922030000_complete_notifications_system.sql
-- Complete Qleenq Notifications System: vibe, space_message, vibe_hangout, hangout_join

-- 1. Structural Fix: Allow NULL hangout_id for non-hangout notifications (e.g. vibe)
ALTER TABLE public.notifications ALTER COLUMN hangout_id DROP NOT NULL;

-- 2. Create Partial Unique Indexes for Vibe and Hangout Join Deduplication
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_vibe
  ON public.notifications (user_id, actor_id, type)
  WHERE type = 'vibe';

CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_hangout_join
  ON public.notifications (user_id, hangout_id, type, actor_id)
  WHERE type = 'hangout_join';

-- 3. Trigger Function 1: Vibe Notification (on public.follows INSERT)
CREATE OR REPLACE FUNCTION public.notify_vibe_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
BEGIN
  BEGIN
    -- Prevent self-vibe notifications
    IF NEW.follower_id = NEW.following_id THEN
      RETURN NEW;
    END IF;

    -- Fetch actor's display name from profiles
    SELECT coalesce(name, 'Someone') INTO actor_name
    FROM public.profiles
    WHERE id = NEW.follower_id;

    -- Create vibe notification for target user (following_id)
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
    VALUES (
      NEW.following_id,
      NEW.follower_id,
      NULL,
      'vibe',
      'Someone is vibing with you',
      actor_name || ' is now vibing with you.',
      false,
      now()
    )
    ON CONFLICT (user_id, actor_id, type) WHERE type = 'vibe'
    DO UPDATE SET
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      is_read = false,
      created_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_vibe_on_follow notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_created_notify_vibe ON public.follows;
CREATE TRIGGER on_follow_created_notify_vibe
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_vibe_on_follow();

-- 4. Trigger Function 2: Space Message Notification (on public.hangout_messages INSERT)
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
  BEGIN
    SELECT coalesce(name, 'An attendee') INTO sender_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    SELECT coalesce(title, 'a Hangout') INTO hangout_title
    FROM public.hangouts
    WHERE id = NEW.hangout_id;

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
    SELECT DISTINCT
      target_id,
      NEW.user_id,
      NEW.hangout_id,
      'space_message',
      'New message in a Hangout',
      sender_name || ' sent a new message in ' || hangout_title,
      false,
      now()
    FROM (
      SELECT user_id AS target_id FROM public.hangout_attendees WHERE hangout_id = NEW.hangout_id
      UNION
      SELECT host_id AS target_id FROM public.hangouts WHERE id = NEW.hangout_id
    ) targets
    WHERE target_id != NEW.user_id
    ON CONFLICT (user_id, hangout_id, type)
    DO UPDATE SET
      actor_id = EXCLUDED.actor_id,
      title = EXCLUDED.title,
      message = EXCLUDED.message,
      is_read = false,
      created_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_space_message_attendees notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_space_message_inserted_notify_attendees ON public.hangout_messages;
CREATE TRIGGER on_space_message_inserted_notify_attendees
  AFTER INSERT ON public.hangout_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_space_message_attendees();

-- 5. Trigger Function 3: Vibe Follower New Hangout Notification (on public.hangouts INSERT)
CREATE OR REPLACE FUNCTION public.notify_vibe_followers_on_hangout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_name text;
BEGIN
  BEGIN
    SELECT coalesce(name, 'Someone you vibe with') INTO host_name
    FROM public.profiles
    WHERE id = NEW.host_id;

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
      f.follower_id,
      NEW.host_id,
      NEW.id,
      'vibe_hangout',
      'New Hangout from someone you vibe with',
      host_name || ' is hosting a new Hangout: ' || NEW.title,
      false,
      now()
    FROM public.follows f
    WHERE f.following_id = NEW.host_id
      AND f.follower_id != NEW.host_id
    ON CONFLICT (user_id, hangout_id, type) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_vibe_followers_on_hangout notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_hangout_created_notify_followers ON public.hangouts;
CREATE TRIGGER on_hangout_created_notify_followers
  AFTER INSERT ON public.hangouts
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_vibe_followers_on_hangout();

-- 6. Trigger Function 4: Hangout Join Notification for Host (on public.hangout_attendees INSERT)
CREATE OR REPLACE FUNCTION public.notify_host_on_hangout_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_user_id uuid;
  joiner_name text;
  hangout_title text;
BEGIN
  BEGIN
    -- Fetch hangout host and title
    SELECT host_id, coalesce(title, 'your Hangout') INTO host_user_id, hangout_title
    FROM public.hangouts
    WHERE id = NEW.hangout_id;

    -- Do not notify if host joins their own hangout
    IF host_user_id IS NULL OR NEW.user_id = host_user_id THEN
      RETURN NEW;
    END IF;

    -- Fetch joiner's display name
    SELECT coalesce(name, 'Someone') INTO joiner_name
    FROM public.profiles
    WHERE id = NEW.user_id;

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
    VALUES (
      host_user_id,
      NEW.user_id,
      NEW.hangout_id,
      'hangout_join',
      'Someone joined your Hangout',
      joiner_name || ' joined your Hangout: ' || hangout_title,
      false,
      now()
    )
    ON CONFLICT (user_id, hangout_id, type, actor_id) WHERE type = 'hangout_join'
    DO UPDATE SET
      is_read = false,
      created_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_host_on_hangout_join notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_hangout_attendee_joined_notify_host ON public.hangout_attendees;
CREATE TRIGGER on_hangout_attendee_joined_notify_host
  AFTER INSERT ON public.hangout_attendees
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_host_on_hangout_join();
