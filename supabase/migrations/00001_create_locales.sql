-- BRD §3.2.1 / §6.1 — Source of truth for all configured locales
-- Adding a row activates the locale sitewide (BRD §9.1 AC7)

CREATE TABLE public.locales (
  code        TEXT PRIMARY KEY,       -- e.g. 'en', 'bn-BD', 'sv'
  name        TEXT NOT NULL,          -- Display name
  script      TEXT NOT NULL DEFAULT 'Latin', -- 'Latin' | 'Bengali'
  direction   TEXT NOT NULL DEFAULT 'LTR',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.locales (code, name, script, direction, is_active, is_default) VALUES
  ('en',    'English',  'Latin',   'LTR', true, true),
  ('bn-BD', 'বাংলা',    'Bengali', 'LTR', true, false),
  ('sv',    'Svenska',  'Latin',   'LTR', true, false);

-- Ensure only one default
CREATE UNIQUE INDEX idx_locales_default ON public.locales (is_default) WHERE is_default = true;

ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Locales are publicly readable"
  ON public.locales FOR SELECT
  USING (true);

-- Admin-only write
CREATE POLICY "Only admins can modify locales"
  ON public.locales FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'administrator'
  );
