-- Migration: 20260922020000_fix_space_message_notifications.sql
-- Exception Safety & Host Recipient Fix for Space Message Notifications

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
    -- Get sender's display name from profiles
    SELECT coalesce(name, 'An attendee') INTO sender_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Get hangout title
    SELECT coalesce(title, 'a Hangout') INTO hangout_title
    FROM public.hangouts
    WHERE id = NEW.hangout_id;

    -- Create or update notification for all current attendees and host, except the sender
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
    -- Exception guard: ensure notification errors never fail or rollback primary message inserts
    RAISE WARNING 'notify_space_message_attendees notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Re-attach trigger to public.hangout_messages
DROP TRIGGER IF EXISTS on_space_message_inserted_notify_attendees ON public.hangout_messages;
CREATE TRIGGER on_space_message_inserted_notify_attendees
  AFTER INSERT ON public.hangout_messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_space_message_attendees();
