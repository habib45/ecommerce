-- Add 'about_us' and 'contact_us' to content_blocks type constraint
-- and add admin write policy for content management

-- Drop and recreate the CHECK constraint to allow new types
ALTER TABLE public.content_blocks
  DROP CONSTRAINT IF EXISTS content_blocks_type_check;

ALTER TABLE public.content_blocks
  ADD CONSTRAINT content_blocks_type_check
  CHECK (type IN ('banner', 'featured_section', 'promo', 'about_us', 'contact_us'));

-- GIN indexes on JSONB columns (name already has one; add body)
CREATE INDEX IF NOT EXISTS idx_content_blocks_body_gin
  ON public.content_blocks USING GIN (body);

-- Admin write policy using is_admin_user() from migration 00015
-- (SECURITY DEFINER function that checks profiles.role — avoids RLS recursion)
DROP POLICY IF EXISTS "Content blocks admin write" ON public.content_blocks;
CREATE POLICY "Content blocks admin write" ON public.content_blocks
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
