-- BRD §6.1 — JSONB translation pattern with GIN indexes

CREATE TABLE public.categories (
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

-- BRD §4.6 — GIN indexes on all JSONB translation columns
CREATE INDEX idx_categories_name_gin ON public.categories USING GIN (name);
CREATE INDEX idx_categories_slug_gin ON public.categories USING GIN (slug);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL
  USING (auth.jwt() ->> 'role' IN ('administrator', 'store_manager'));
