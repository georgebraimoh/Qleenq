-- Qleenq Backend V1
-- Apply in Supabase Dashboard → SQL Editor (Run), or: supabase db push
--
-- Matches the live client in:
--   src/services/auth/authService.js
--   src/services/hangout/hangoutService.js
-- Column names stay as the app already writes them (name, avatar, host_id,
-- hangout_attendees, date + time, category as text). Additive fields only:
-- organizer flags, categories, follows.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles  (id = auth.users.id)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Qleenq User',
  username text,
  avatar text,
  location text DEFAULT 'Abuja',
  bio text DEFAULT '',
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  hosted_count integer NOT NULL DEFAULT 0,
  attended_count integer NOT NULL DEFAULT 0,
  is_organizer boolean NOT NULL DEFAULT false,
  is_verified_organizer boolean NOT NULL DEFAULT false,
  organizer_verified_at timestamptz,
  followers_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hosted_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS attended_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_organizer boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_organizer boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organizer_verified_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND username <> '';

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- Auto-create a profile when Auth creates a user (OAuth / email).
-- Client insert remains allowed; ON CONFLICT avoids races.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_name text;
  raw_username text;
  raw_avatar text;
BEGIN
  raw_name := coalesce(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Qleenq User'
  );

  raw_username := coalesce(
    NEW.raw_user_meta_data->>'username',
    regexp_replace(lower(split_part(coalesce(NEW.email, ''), '@', 1)), '[^a-z0-9]', '_', 'g'),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  raw_avatar := coalesce(
    NEW.raw_user_meta_data->>'avatar',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, name, username, avatar, bio)
  VALUES (
    NEW.id,
    raw_name,
    raw_username,
    raw_avatar,
    'Joined Qleenq to discover fun activities around the world!'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Verified organizer is never a client toggle.
CREATE OR REPLACE FUNCTION public.protect_verified_organizer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_verified_organizer IS DISTINCT FROM OLD.is_verified_organizer
     OR NEW.organizer_verified_at IS DISTINCT FROM OLD.organizer_verified_at THEN
    IF coalesce(auth.role(), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Verified organizer status can only be changed by Qleenq';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_verified_organizer ON public.profiles;
CREATE TRIGGER protect_verified_organizer
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_verified_organizer();

-- ---------------------------------------------------------------------------
-- hangouts  (person hosts — host_id, not an organization)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hangouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  image text,
  date date,
  time time,
  place_name text,
  address text,
  city text,
  country text,
  country_code text,
  latitude double precision,
  longitude double precision,
  max_attendees integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'upcoming',
  featured boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hangouts_max_attendees_chk CHECK (max_attendees >= 2)
);

ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS host_id uuid;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS time time;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS place_name text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS max_attendees integer DEFAULT 10;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS status text DEFAULT 'upcoming';
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false;
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.hangouts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS hangouts_host_id_idx ON public.hangouts (host_id);
CREATE INDEX IF NOT EXISTS hangouts_created_at_idx ON public.hangouts (created_at DESC);
CREATE INDEX IF NOT EXISTS hangouts_category_idx ON public.hangouts (category);
CREATE INDEX IF NOT EXISTS hangouts_status_idx ON public.hangouts (status);
CREATE INDEX IF NOT EXISTS hangouts_city_idx ON public.hangouts (city);

DROP TRIGGER IF EXISTS hangouts_set_updated_at ON public.hangouts;
CREATE TRIGGER hangouts_set_updated_at
  BEFORE UPDATE ON public.hangouts
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

CREATE OR REPLACE FUNCTION public.mark_host_as_organizer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    is_organizer = true,
    hosted_count = coalesce(hosted_count, 0) + 1,
    updated_at = now()
  WHERE id = NEW.host_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hangouts_mark_organizer ON public.hangouts;
CREATE TRIGGER hangouts_mark_organizer
  AFTER INSERT ON public.hangouts
  FOR EACH ROW
  EXECUTE PROCEDURE public.mark_host_as_organizer();

-- ---------------------------------------------------------------------------
-- hangout_attendees  (join / leave — later rename toward hangout_members)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hangout_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hangout_id uuid NOT NULL REFERENCES public.hangouts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hangout_attendees ADD COLUMN IF NOT EXISTS hangout_id uuid;
ALTER TABLE public.hangout_attendees ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.hangout_attendees ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS hangout_attendees_unique
  ON public.hangout_attendees (hangout_id, user_id);

CREATE INDEX IF NOT EXISTS hangout_attendees_user_id_idx
  ON public.hangout_attendees (user_id);

CREATE OR REPLACE FUNCTION public.enforce_hangout_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cap integer;
  current_count integer;
BEGIN
  SELECT max_attendees INTO cap FROM public.hangouts WHERE id = NEW.hangout_id;
  SELECT count(*) INTO current_count FROM public.hangout_attendees WHERE hangout_id = NEW.hangout_id;

  IF cap IS NOT NULL AND current_count >= cap THEN
    RAISE EXCEPTION 'This hangout is at full capacity';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hangout_attendees_capacity ON public.hangout_attendees;
CREATE TRIGGER hangout_attendees_capacity
  BEFORE INSERT ON public.hangout_attendees
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_hangout_capacity();

CREATE OR REPLACE FUNCTION public.prevent_host_leave()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.hangouts
    WHERE id = OLD.hangout_id
      AND host_id = OLD.user_id
  ) THEN
    RAISE EXCEPTION 'Hosts cannot leave their own hangout';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS hangout_attendees_prevent_host_leave ON public.hangout_attendees;
CREATE TRIGGER hangout_attendees_prevent_host_leave
  BEFORE DELETE ON public.hangout_attendees
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_host_leave();

CREATE OR REPLACE FUNCTION public.is_hangout_member(_hangout_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.hangout_attendees
        WHERE hangout_id = _hangout_id AND user_id = _user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.hangouts
        WHERE id = _hangout_id AND host_id = _user_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.is_hangout_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_hangout_member(uuid, uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- hangout_messages  (Qleenq Space)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hangout_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hangout_id uuid NOT NULL REFERENCES public.hangouts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  user_name text,
  user_avatar text,
  text text NOT NULL,
  type text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hangout_messages_text_chk CHECK (char_length(trim(text)) > 0)
);

ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS hangout_id uuid;
ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS user_avatar text;
ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'user';
ALTER TABLE public.hangout_messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS hangout_messages_hangout_created_idx
  ON public.hangout_messages (hangout_id, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hangout_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hangout_messages;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- categories  (system seeds + future custom)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  is_system boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key
  ON public.categories (lower(slug));

INSERT INTO public.categories (name, slug, is_system, status)
SELECT v.name, v.slug, true, 'approved'
FROM (
  VALUES
    ('Food & Drinks', 'food'),
    ('Music & Nightlife', 'music'),
    ('Sports & Run', 'sports'),
    ('Board & Console', 'gaming'),
    ('Photography', 'photography'),
    ('Cinema & Chill', 'movies'),
    ('Art & Design', 'creative'),
    ('Tech & Coffee', 'tech'),
    ('Outdoors & Kayak', 'outdoors'),
    ('Casual Meetups', 'other')
) AS v(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE lower(c.slug) = v.slug
);

-- ---------------------------------------------------------------------------
-- follows  (follow a person to see when they host — not a life feed)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- hangouts: discovery is public; write is the host
DROP POLICY IF EXISTS "hangouts_select_public" ON public.hangouts;
CREATE POLICY "hangouts_select_public"
  ON public.hangouts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hangouts_insert_own" ON public.hangouts;
CREATE POLICY "hangouts_insert_own"
  ON public.hangouts FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "hangouts_update_host" ON public.hangouts;
CREATE POLICY "hangouts_update_host"
  ON public.hangouts FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "hangouts_delete_host" ON public.hangouts;
CREATE POLICY "hangouts_delete_host"
  ON public.hangouts FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());

-- attendees: public counts on cards; join/leave self
DROP POLICY IF EXISTS "hangout_attendees_select_public" ON public.hangout_attendees;
CREATE POLICY "hangout_attendees_select_public"
  ON public.hangout_attendees FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hangout_attendees_insert_own" ON public.hangout_attendees;
CREATE POLICY "hangout_attendees_insert_own"
  ON public.hangout_attendees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "hangout_attendees_delete_own" ON public.hangout_attendees;
CREATE POLICY "hangout_attendees_delete_own"
  ON public.hangout_attendees FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- messages: members only (host counts as member)
DROP POLICY IF EXISTS "hangout_messages_select_members" ON public.hangout_messages;
CREATE POLICY "hangout_messages_select_members"
  ON public.hangout_messages FOR SELECT
  TO authenticated
  USING (public.is_hangout_member(hangout_id, auth.uid()));

DROP POLICY IF EXISTS "hangout_messages_insert_members" ON public.hangout_messages;
CREATE POLICY "hangout_messages_insert_members"
  ON public.hangout_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_hangout_member(hangout_id, auth.uid())
  );

-- categories
DROP POLICY IF EXISTS "categories_select_approved" ON public.categories;
CREATE POLICY "categories_select_approved"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "categories_insert_custom" ON public.categories;
CREATE POLICY "categories_insert_custom"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND is_system = false
    AND status IN ('pending', 'approved')
  );

-- follows
DROP POLICY IF EXISTS "follows_select_authenticated" ON public.follows;
CREATE POLICY "follows_select_authenticated"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid() AND follower_id <> following_id);

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Clients cannot SET is_verified_organizer / counts via UPDATE grants.
DO $$
BEGIN
  REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
  GRANT UPDATE (
    name,
    username,
    avatar,
    location,
    bio,
    interests
  ) ON TABLE public.profiles TO authenticated;
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'profiles column UPDATE grant skipped: %', SQLERRM;
END $$;

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.hangouts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.hangouts TO authenticated;
GRANT SELECT ON TABLE public.hangout_attendees TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.hangout_attendees TO authenticated;
GRANT SELECT, INSERT ON TABLE public.hangout_messages TO authenticated;
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT INSERT ON TABLE public.categories TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.follows TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets used by the client
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hangout-images',
  'hangout-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
CREATE POLICY "profile_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert_own_folder" ON storage.objects;
CREATE POLICY "profile_images_insert_own_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_images_delete_own_folder" ON storage.objects;
CREATE POLICY "profile_images_delete_own_folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "hangout_images_public_read" ON storage.objects;
CREATE POLICY "hangout_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'hangout-images');

DROP POLICY IF EXISTS "hangout_images_insert_own_folder" ON storage.objects;
CREATE POLICY "hangout_images_insert_own_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hangout-images'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "hangout_images_delete_own_folder" ON storage.objects;
CREATE POLICY "hangout_images_delete_own_folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hangout-images'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
