-- BRD §6.1 — email_templates, webhook_events, fx_rates, content_blocks, discount_codes

-- Email Templates: one row per email type per locale
CREATE TABLE public.email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  locale      TEXT NOT NULL REFERENCES public.locales(code),
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (type, locale)
);

-- Webhook Events: idempotent processing via Stripe event ID (BRD §3.6.3)
CREATE TABLE public.webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  processed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FX Rates (BRD §3.3)
CREATE TABLE public.fx_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate            NUMERIC(12,6) NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);

-- Content Blocks: banners, featured sections (BRD §6.1)
CREATE TABLE public.content_blocks (
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

CREATE INDEX idx_content_blocks_name_gin ON public.content_blocks USING GIN (name);

-- Discount Codes (BRD §3.1.3)
CREATE TABLE public.discount_codes (
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

-- Slug Redirects (BRD §3.10)
CREATE TABLE public.slug_redirects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path   TEXT NOT NULL,
  to_path     TEXT NOT NULL,
  locale      TEXT NOT NULL REFERENCES public.locales(code),
  status_code INT NOT NULL DEFAULT 301
);

CREATE INDEX idx_slug_redirects_from ON public.slug_redirects(from_path, locale);

-- Return Requests (BRD §3.8)
CREATE TABLE public.return_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  status        TEXT NOT NULL DEFAULT 'requested'
                CHECK (status IN ('requested','approved','rejected','info_requested','received','refunded')),
  reason_code   TEXT NOT NULL,
  reason_detail TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.return_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  quantity      INT NOT NULL DEFAULT 1,
  condition     TEXT NOT NULL DEFAULT 'unopened'
);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns" ON public.return_requests FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create returns" ON public.return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for returns queue (BRD §3.8.2)
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;

-- RLS for supporting tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content blocks are publicly readable" ON public.content_blocks FOR SELECT USING (true);
CREATE POLICY "Email templates admin only" ON public.email_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'administrator');
CREATE POLICY "Discount codes are publicly readable" ON public.discount_codes FOR SELECT USING (true);
