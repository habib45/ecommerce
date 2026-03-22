-- Fix: auth.jwt() ->> 'role' returns the Postgres role ('anon'/'authenticated'),
-- NOT the application role stored in public.profiles.
-- Replace all admin policies to look up profiles table instead.

-- Ensure is_featured column exists (migration 0001 may not have been applied)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;

-- ── Categories ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );

-- ── Products ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );

-- ── Product Variants ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage variants" ON public.product_variants;
CREATE POLICY "Admin can manage variants" ON public.product_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );

-- ── Product Images ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage images" ON public.product_images;
CREATE POLICY "Admin can manage images" ON public.product_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );
