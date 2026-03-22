-- ========================================
-- PART 1: CORE TABLES
-- ========================================

-- MIGRATION 1: CREATE LOCALES
CREATE TABLE IF NOT EXISTS public.locales (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  script      TEXT NOT NULL DEFAULT 'Latin',
  direction   TEXT NOT NULL DEFAULT 'LTR',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.locales (code, name, script, direction, is_active, is_default) VALUES
  ('en',    'English',  'Latin',   'LTR', true, true),
  ('bn-BD', 'বাংলা',    'Bengali', 'LTR', true, false),
  ('sv',    'Svenska',  'Latin',   'LTR', true, false)
ON CONFLICT DO NOTHING;

ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Locales are publicly readable" ON public.locales;
CREATE POLICY "Locales are publicly readable" ON public.locales FOR SELECT USING (true);

-- MIGRATION 2: CREATE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  language_pref   TEXT NOT NULL DEFAULT 'en' REFERENCES public.locales(code),
  currency_pref   TEXT NOT NULL DEFAULT 'USD',
  role            TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'administrator', 'store_manager', 'support_agent')),
  stripe_customer_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- MIGRATION 3: CREATE CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES public.categories(id),
  name            JSONB NOT NULL DEFAULT '{}',
  slug            JSONB NOT NULL DEFAULT '{}',
  description     JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);

-- Insert demo category
INSERT INTO public.categories (name, slug, description, is_active, sort_order) VALUES
('{"en": "Electronics", "bn-BD": "ইলেকট্রনিক্স", "sv": "Elektronik"}', 
 '{"en": "electronics", "bn-BD": "electronics", "sv": "elektronik"}',
 '{"en": "Electronic devices and gadgets", "bn-BD": "ইলেকট্রনিক ডিভাইস এবং গ্যাজেট", "sv": "Elektroniska enheter och gadgetar"}',
 true, 0)
ON CONFLICT DO NOTHING;

-- MIGRATION 4: CREATE PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       UUID REFERENCES public.categories(id),
  name              JSONB NOT NULL DEFAULT '{}',
  slug              JSONB NOT NULL DEFAULT '{}',
  description       JSONB NOT NULL DEFAULT '{}',
  product_type      TEXT NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- Insert demo product
WITH category_id AS (
  SELECT id FROM public.categories WHERE slug->>'en' = 'electronics' LIMIT 1
)
INSERT INTO public.products (category_id, name, slug, description, product_type, is_active)
SELECT c.id,
  '{"en": "Premium Wireless Headphones", "bn-BD": "প্রিমিয়াম ওয়্যারলেস হেডফোন", "sv": "Premium trådlösa hörlurar"}',
  '{"en": "premium-wireless-headphones", "bn-BD": "premium-wireless-headphones", "sv": "premium-tradlosa-horluror"}',
  '{"en": "Experience premium sound with active noise cancellation", "bn-BD": "প্রিমিয়াম সাউন্ড শুনুন", "sv": "Upplev premium-ljud"}',
  'physical', true
FROM category_id c
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku             TEXT NOT NULL UNIQUE,
  name            JSONB NOT NULL DEFAULT '{}',
  prices          JSONB NOT NULL DEFAULT '{}',
  stock_quantity  INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert demo variant
WITH product_id AS (
  SELECT id FROM public.products WHERE slug->>'en' = 'premium-wireless-headphones' LIMIT 1
)
INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active)
SELECT p.id, 'SKU-WH-001', '{"en": "Black", "bn-BD": "কালো", "sv": "Svart"}',
  '{"USD": 29999, "BDT": 3500000, "SEK": 299000}'::JSONB,
  100, true
FROM product_id p
ON CONFLICT (sku) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    JSONB NOT NULL DEFAULT '{}',
  sort_order  INT NOT NULL DEFAULT 0
);

-- Insert demo image
WITH product_id AS (
  SELECT id FROM public.products WHERE slug->>'en' = 'premium-wireless-headphones' LIMIT 1
)
INSERT INTO public.product_images (product_id, url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  '{"en": "Premium Wireless Headphones", "bn-BD": "প্রিমিয়াম ওয়্যারলেস হেডফোন", "sv": "Premium trådlösa hörlurar"}',
  0
FROM product_id p
ON CONFLICT DO NOTHING;

