-- ========================================
-- PART 3: SUPPORTING TABLES & DEMO DATA
-- ========================================

-- Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  locale      TEXT NOT NULL REFERENCES public.locales(code),
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (type, locale)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Webhook Events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  processed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FX Rates
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate            NUMERIC(12,6) NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);

-- Insert demo FX rates
INSERT INTO public.fx_rates (base_currency, target_currency, rate) VALUES
('USD', 'BDT', 110),
('USD', 'SEK', 10),
('BDT', 'USD', 0.0091),
('SEK', 'USD', 0.1)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate;

-- Content Blocks
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('banner', 'featured_section', 'promo')),
  name        JSONB NOT NULL DEFAULT '{}',
  body        JSONB NOT NULL DEFAULT '{}',
  cta_label   JSONB NOT NULL DEFAULT '{}',
  cta_url     JSONB NOT NULL DEFAULT '{}',
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Content blocks are publicly readable" ON public.content_blocks;
CREATE POLICY "Content blocks are publicly readable" ON public.content_blocks FOR SELECT USING (true);

-- Discount Codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value           INT NOT NULL,
  currency        TEXT,
  min_order_amount INT,
  max_uses        INT,
  used_count      INT NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Discount codes are publicly readable" ON public.discount_codes;
CREATE POLICY "Discount codes are publicly readable" ON public.discount_codes FOR SELECT USING (true);

-- Insert demo discount code
INSERT INTO public.discount_codes (code, type, value, currency, min_order_amount, is_active) VALUES
('WELCOME10', 'percentage', 10, 'USD', 1000, true)
ON CONFLICT (code) DO NOTHING;

-- Slug Redirects
CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path   TEXT NOT NULL,
  to_path     TEXT NOT NULL,
  locale      TEXT NOT NULL REFERENCES public.locales(code),
  status_code INT NOT NULL DEFAULT 301
);

CREATE INDEX IF NOT EXISTS idx_slug_redirects_from ON public.slug_redirects(from_path, locale);

-- Return Requests
CREATE TABLE IF NOT EXISTS public.return_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  status        TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','info_requested','received','refunded')),
  reason_code   TEXT NOT NULL,
  reason_detail TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  quantity      INT NOT NULL DEFAULT 1,
  condition     TEXT NOT NULL DEFAULT 'unopened'
);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own returns" ON public.return_requests;
CREATE POLICY "Users can view own returns" ON public.return_requests FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

SELECT 
  'Locales' as table_name, 
  (SELECT count(*) FROM public.locales)::text as count
UNION ALL
SELECT 'Categories', (SELECT count(*) FROM public.categories)::text
UNION ALL
SELECT 'Products', (SELECT count(*) FROM public.products)::text
UNION ALL
SELECT 'Product Variants', (SELECT count(*) FROM public.product_variants)::text
UNION ALL
SELECT 'Discount Codes', (SELECT count(*) FROM public.discount_codes)::text
UNION ALL
SELECT 'FX Rates', (SELECT count(*) FROM public.fx_rates)::text;

