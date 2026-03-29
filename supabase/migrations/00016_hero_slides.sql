-- BRD §3.1 content_blocks — Hero Slides: admin-controlled banner carousel

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  description TEXT,
  image_url   TEXT        NOT NULL,
  bg_overlay  TEXT        NOT NULL DEFAULT 'from-gray-900/50 to-gray-900/30',
  cta_label   TEXT,
  cta_href    TEXT,
  show_text   BOOLEAN     NOT NULL DEFAULT true,
  show_button BOOLEAN     NOT NULL DEFAULT true,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  height_px   INTEGER     NOT NULL DEFAULT 480,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_hero_slides_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER trg_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_hero_slides_updated_at();

-- RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public: read active slides (storefront)
DROP POLICY IF EXISTS "Public read active slides" ON public.hero_slides;
CREATE POLICY "Public read active slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

-- Admins: full access (uses is_admin_user() from migration 00015)
DROP POLICY IF EXISTS "Admins manage slides" ON public.hero_slides;
CREATE POLICY "Admins manage slides"
  ON public.hero_slides FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Seed with one demo slide
INSERT INTO public.hero_slides (title, description, image_url, cta_label, cta_href, sort_order)
VALUES (
  'Welcome to Our Store',
  'Discover our exclusive collection of premium products',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
  'Shop Now',
  '/en/products',
  0
) ON CONFLICT DO NOTHING;
