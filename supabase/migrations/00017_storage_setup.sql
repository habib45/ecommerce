-- Media storage bucket + RLS policies for admin file management

-- 1. Create the media bucket (public — files accessible via public URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,   -- 50 MB per file
  null        -- allow all mime types
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS on storage.objects
--    Uses is_admin_user() from migration 00015 (SECURITY DEFINER — safe in storage context)

-- Public: anyone can read files from the media bucket
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Admins: upload (insert)
DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
CREATE POLICY "Admins upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND public.is_admin_user()
  );

-- Admins: update (upsert / metadata)
DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'media' AND public.is_admin_user());

-- Admins: delete
DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND public.is_admin_user());
