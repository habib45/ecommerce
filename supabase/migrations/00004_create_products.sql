-- BRD §6.1 — products with JSONB translations + per-locale tsvector FTS

CREATE TABLE public.products (
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
  -- BRD §3.1.2 / §4.6 — per-locale tsvector columns
  search_vector_en  TSVECTOR,
  search_vector_sv  TSVECTOR,
  search_vector_bn  TSVECTOR,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GIN indexes on all JSONB translation columns (BRD §4.6)
CREATE INDEX idx_products_name_gin ON public.products USING GIN (name);
CREATE INDEX idx_products_slug_gin ON public.products USING GIN (slug);
CREATE INDEX idx_products_desc_gin ON public.products USING GIN (description);
CREATE INDEX idx_products_meta_title_gin ON public.products USING GIN (meta_title);

-- GIN indexes on tsvector columns for FTS
CREATE INDEX idx_products_fts_en ON public.products USING GIN (search_vector_en);
CREATE INDEX idx_products_fts_sv ON public.products USING GIN (search_vector_sv);
CREATE INDEX idx_products_fts_bn ON public.products USING GIN (search_vector_bn);

-- Product variants (BRD §3.1.1)
CREATE TABLE public.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku             TEXT NOT NULL UNIQUE,
  name            JSONB NOT NULL DEFAULT '{}',
  prices          JSONB NOT NULL DEFAULT '{}',  -- {USD: 2999, BDT: 350000, SEK: 29900}
  sale_prices     JSONB DEFAULT NULL,
  sale_start      TIMESTAMPTZ,
  sale_end        TIMESTAMPTZ,
  stock_quantity  INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product ON public.product_variants(product_id);

-- Product images (BRD §3.1.1 — up to 10 per product)
CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    JSONB NOT NULL DEFAULT '{}',
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_images_product ON public.product_images(product_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON public.products FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

CREATE POLICY "Variants are publicly readable" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admin can manage variants" ON public.product_variants FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));

CREATE POLICY "Images are publicly readable" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admin can manage images" ON public.product_images FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));
