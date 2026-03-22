-- ========================================
-- SIMBOLOS E-COMMERCE DATABASE MIGRATIONS
-- ========================================
-- Execute this entire script in Supabase Dashboard > SQL Editor
-- All 8 migrations + demo data included below
-- This is an idempotent script - can be run multiple times safely

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_locales_default ON public.locales (is_default) WHERE is_default = true;
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Locales are publicly readable" ON public.locales;
CREATE POLICY "Locales are publicly readable" ON public.locales FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can modify locales" ON public.locales;
CREATE POLICY "Only admins can modify locales" ON public.locales FOR ALL
  USING (auth.jwt() ->> 'role' = 'administrator');

-- MIGRATION 2: CREATE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  language_pref   TEXT NOT NULL DEFAULT 'en' REFERENCES public.locales(code),
  currency_pref   TEXT NOT NULL DEFAULT 'USD',
  role            TEXT NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'administrator', 'store_manager', 'support_agent')),
  stripe_customer_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, language_pref)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'language_pref', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MIGRATION 3: CREATE CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES public.categories(id),
  name            JSONB NOT NULL DEFAULT '{}',
  slug            JSONB NOT NULL DEFAULT '{}',
  description     JSONB NOT NULL DEFAULT '{}',
  meta_title      JSONB NOT NULL DEFAULT '{}',
  meta_description JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_name_gin ON public.categories USING GIN (name);
CREATE INDEX IF NOT EXISTS idx_categories_slug_gin ON public.categories USING GIN (slug);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

INSERT INTO public.categories (name, slug, description, meta_title, meta_description, is_active, sort_order) VALUES
('{"en": "Electronics", "bn-BD": "ইলেকট্রনিক্স", "sv": "Elektronik"}',
 '{"en": "electronics", "bn-BD": "electronics", "sv": "elektronik"}',
 '{"en": "Electronic devices and gadgets", "bn-BD": "ইলেকট্রনিক ডিভাইস এবং গ্যাজেট", "sv": "Elektroniska enheter och gadgetar"}',
 '{"en": "Electronics | Simbolos", "bn-BD": "ইলেকট্রনিক্স | সিম্বলস", "sv": "Elektronik | Simbolos"}',
 '{"en": "Shop our electronics collection", "bn-BD": "আমাদের ইলেকট্রনিক্স সংগ্রহ কেনাকাটা করুন", "sv": "Handla vår elektroniksamling"}',
 true, 0)
ON CONFLICT DO NOTHING;

-- MIGRATION 4: CREATE PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       UUID REFERENCES public.categories(id),
  name              JSONB NOT NULL DEFAULT '{}',
  slug              JSONB NOT NULL DEFAULT '{}',
  description       JSONB NOT NULL DEFAULT '{}',
  short_description JSONB NOT NULL DEFAULT '{}',
  meta_title        JSONB NOT NULL DEFAULT '{}',
  meta_description  JSONB NOT NULL DEFAULT '{}',
  product_type      TEXT NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  search_vector_en  TSVECTOR,
  search_vector_sv  TSVECTOR,
  search_vector_bn  TSVECTOR,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_name_gin ON public.products USING GIN (name);
CREATE INDEX IF NOT EXISTS idx_products_slug_gin ON public.products USING GIN (slug);
CREATE INDEX IF NOT EXISTS idx_products_desc_gin ON public.products USING GIN (description);
CREATE INDEX IF NOT EXISTS idx_products_meta_title_gin ON public.products USING GIN (meta_title);
CREATE INDEX IF NOT EXISTS idx_products_fts_en ON public.products USING GIN (search_vector_en);
CREATE INDEX IF NOT EXISTS idx_products_fts_sv ON public.products USING GIN (search_vector_sv);
CREATE INDEX IF NOT EXISTS idx_products_fts_bn ON public.products USING GIN (search_vector_bn);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku             TEXT NOT NULL UNIQUE,
  name            JSONB NOT NULL DEFAULT '{}',
  prices          JSONB NOT NULL DEFAULT '{}',
  sale_prices     JSONB DEFAULT NULL,
  sale_start      TIMESTAMPTZ,
  sale_end        TIMESTAMPTZ,
  stock_quantity  INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);

CREATE TABLE IF NOT EXISTS public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    JSONB NOT NULL DEFAULT '{}',
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_images_product ON public.product_images(product_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

DROP POLICY IF EXISTS "Variants are publicly readable" ON public.product_variants;
CREATE POLICY "Variants are publicly readable" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage variants" ON public.product_variants;
CREATE POLICY "Admin can manage variants" ON public.product_variants FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

DROP POLICY IF EXISTS "Images are publicly readable" ON public.product_images;
CREATE POLICY "Images are publicly readable" ON public.product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage images" ON public.product_images;
CREATE POLICY "Admin can manage images" ON public.product_images FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

-- MIGRATION 5: CREATE SEARCH TRIGGERS
CREATE OR REPLACE FUNCTION public.update_product_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector_en := to_tsvector('english',
    COALESCE(NEW.name ->> 'en', '') || ' ' ||
    COALESCE(NEW.description ->> 'en', '') || ' ' ||
    COALESCE(NEW.short_description ->> 'en', '')
  );
  NEW.search_vector_sv := to_tsvector('swedish',
    COALESCE(NEW.name ->> 'sv', '') || ' ' ||
    COALESCE(NEW.description ->> 'sv', '') || ' ' ||
    COALESCE(NEW.short_description ->> 'sv', '')
  );
  NEW.search_vector_bn := to_tsvector('simple',
    COALESCE(NEW.name ->> 'bn-BD', '') || ' ' ||
    COALESCE(NEW.description ->> 'bn-BD', '') || ' ' ||
    COALESCE(NEW.short_description ->> 'bn-BD', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vectors ON public.products;
CREATE TRIGGER trg_products_search_vectors
  BEFORE INSERT OR UPDATE OF name, description, short_description
  ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vectors();

CREATE OR REPLACE FUNCTION public.search_products(
  search_query TEXT,
  search_locale TEXT DEFAULT 'en'
)
RETURNS TABLE (
  id UUID,
  name JSONB,
  slug JSONB,
  short_description JSONB,
  category_name JSONB,
  price_min BIGINT,
  currency TEXT,
  image_url TEXT,
  rank REAL
) AS $$
DECLARE
  ts_config TEXT;
  vector_col TEXT;
BEGIN
  CASE search_locale
    WHEN 'en' THEN ts_config := 'english'; vector_col := 'search_vector_en';
    WHEN 'sv' THEN ts_config := 'swedish'; vector_col := 'search_vector_sv';
    WHEN 'bn-BD' THEN ts_config := 'simple'; vector_col := 'search_vector_bn';
    ELSE ts_config := 'english'; vector_col := 'search_vector_en';
  END CASE;

  RETURN QUERY EXECUTE format(
    'SELECT p.id, p.name, p.slug, p.short_description,
            c.name AS category_name,
            MIN((v.prices ->>> ''USD'')::BIGINT) AS price_min,
            ''USD'' AS currency,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image_url,
            ts_rank(%I, plainto_tsquery(%L, $1)) AS rank
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_variants v ON v.product_id = p.id
     WHERE p.is_active = true AND %I @@ plainto_tsquery(%L, $1)
     GROUP BY p.id, c.name
     ORDER BY rank DESC
     LIMIT 20',
    vector_col, ts_config, vector_col, ts_config
  ) USING search_query;
END;
$$ LANGUAGE plpgsql STABLE;

-- DEMO DATA: Products
INSERT INTO public.products (name, slug, description, short_description, product_type, is_active) VALUES
('{"en": "Wireless Headphones", "bn-BD": "ওয়্যারলেস হেডফোন", "sv": "Trådlösa hörlurar"}',
 '{"en": "wireless-headphones", "bn-BD": "wireless-headphones", "sv": "tradlosa-horluror"}',
 '{"en": "High-quality wireless headphones with noise cancellation", "bn-BD": "শব্দ বাতিল সহ উচ্চমানের ওয়্যারলেস হেডফোন", "sv": "Högkvalitativa trådlösa hörlurar med brusreducering"}',
 '{"en": "Premium wireless headphones", "bn-BD": "প্রিমিয়াম ওয়্যারলেস হেডফোন", "sv": "Premium trådlösa hörlurar"}',
 'physical', true)
ON CONFLICT DO NOTHING;

-- Demo product with more details
WITH category_id AS (
  SELECT id FROM public.categories LIMIT 1
)
INSERT INTO public.products (category_id, name, slug, description, short_description, product_type, is_active)
SELECT c.id,
  '{"en": "Premium Wireless Headphones", "bn-BD": "প্রিমিয়াম ওয়্যারলেস হেডফোন", "sv": "Premium trådlösa hörlurar"}',
  '{"en": "premium-wireless-headphones", "bn-BD": "premium-wireless-headphones", "sv": "premium-tradlosa-horluror"}',
  '{"en": "Experience premium sound with our wireless headphones featuring active noise cancellation, 30-hour battery life, and premium build quality.", "bn-BD": "আমাদের ওয়্যারলেস হেডফোনের সাথে প্রিমিয়াম সাউন্ড অনুভব করুন যাতে সক্রিয় শব্দ বাতিল, 30 ঘন্টার ব্যাটারি লাইফ এবং প্রিমিয়াম বিল্ড কোয়ালিটি রয়েছে।", "sv": "Upplev premium-ljud med våra trådlösa hörlurar med aktiv brusreducering, 30 timmars batteritid och premium byggkvalitet."}',
  '{"en": "Premium sound with ANC", "bn-BD": "ANC সহ প্রিমিয়াম সাউন্ড", "sv": "Premium ljud med ANC"}',
  'physical', true
FROM category_id c
ON CONFLICT DO NOTHING;

-- Insert product variant
WITH product_id AS (
  SELECT id FROM public.products LIMIT 1
)
INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active)
SELECT p.id, 'SKU-WH-001', '{"en": "Black", "bn-BD": "কালো", "sv": "Svart"}',
  '{"USD": 29999, "BDT": 3500000, "SEK": 299000}'::JSONB,
  100, true
FROM product_id p
ON CONFLICT (sku) DO NOTHING;

WITH product_id AS (
  SELECT id FROM public.products WHERE slug->>'en' = 'premium-wireless-headphones' LIMIT 1
)
INSERT INTO public.product_images (product_id, url, alt_text, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  '{"en": "Premium Wireless Headphones", "bn-BD": "প্রিমিয়াম ওয়্যারলেস হেডফোন", "sv": "Premium trådlösa hörlurar"}',
  0
FROM product_id p
ON CONFLICT DO NOTHING;

-- MIGRATION 6: CREATE ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id),
  order_number            TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  status                  TEXT NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN ('pending_payment','payment_confirmed','processing',
                                            'partially_shipped','shipped','delivered','completed',
                                            'cancelled','refunded','disputed')),
  locale                  TEXT NOT NULL DEFAULT 'en' REFERENCES public.locales(code),
  currency                TEXT NOT NULL DEFAULT 'USD',
  subtotal                BIGINT NOT NULL DEFAULT 0,
  tax                     BIGINT NOT NULL DEFAULT 0,
  shipping                BIGINT NOT NULL DEFAULT 0,
  total                   BIGINT NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  shipping_address        JSONB NOT NULL DEFAULT '{}',
  billing_address         JSONB NOT NULL DEFAULT '{}',
  email                   TEXT NOT NULL DEFAULT '',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id),
  product_name JSONB NOT NULL DEFAULT '{}',
  variant_name JSONB NOT NULL DEFAULT '{}',
  sku         TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  BIGINT NOT NULL DEFAULT 0,
  total       BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.decrement_inventory(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- MIGRATION 7: CREATE CART
CREATE TABLE IF NOT EXISTS public.carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL DEFAULT 'en',
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user ON public.carts(user_id) WHERE user_id IS NOT NULL;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.carts;
CREATE POLICY "Users can manage own cart" ON public.carts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id),
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL
  USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));

-- MIGRATION 8: SUPPORTING TABLES
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

INSERT INTO public.discount_codes (code, type, value, currency, min_order_amount, is_active) VALUES
('WELCOME10', 'percentage', 10, 'USD', 1000, true)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.fx_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate            NUMERIC(12,6) NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);

INSERT INTO public.fx_rates (base_currency, target_currency, rate) VALUES
('USD', 'BDT', 110),
('USD', 'SEK', 10),
('BDT', 'USD', 0.0091),
('SEK', 'USD', 0.1)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate;

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

CREATE TABLE IF NOT EXISTS public.webhook_events (
  stripe_event_id TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  processed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_content_blocks_name_gin ON public.content_blocks USING GIN (name);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Content blocks are publicly readable" ON public.content_blocks;
CREATE POLICY "Content blocks are publicly readable" ON public.content_blocks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Email templates admin only" ON public.email_templates;
CREATE POLICY "Email templates admin only" ON public.email_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path   TEXT NOT NULL,
  to_path     TEXT NOT NULL,
  locale      TEXT NOT NULL REFERENCES public.locales(code),
  status_code INT NOT NULL DEFAULT 301
);

CREATE INDEX IF NOT EXISTS idx_slug_redirects_from ON public.slug_redirects(from_path, locale);

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
DROP POLICY IF EXISTS "Users can create returns" ON public.return_requests;
CREATE POLICY "Users can create returns" ON public.return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
