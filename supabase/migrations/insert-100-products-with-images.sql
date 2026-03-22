-- ========================================
-- INSERT 100 DEMO PRODUCTS WITH REAL IMAGES
-- ========================================
-- This script generates 100 products with multi-language support,
-- multi-currency pricing, and real Unsplash product images

-- Get the Electronics category ID
WITH electronics_cat AS (
  SELECT id FROM public.categories WHERE slug->>'en' = 'electronics' LIMIT 1
),
products_to_insert AS (
  SELECT
    c.id as category_id,
    i as product_number,
    jsonb_build_object(
      'en', 'Premium Product ' || i,
      'bn-BD', 'প্রিমিয়াম পণ্য ' || i,
      'sv', 'Premium Produkt ' || i
    ) as name,
    jsonb_build_object(
      'en', 'premium-product-' || i,
      'bn-BD', 'premium-product-' || i,
      'sv', 'premium-product-' || i
    ) as slug,
    jsonb_build_object(
      'en', 'High-quality electronic device #' || i || ' with advanced features and excellent performance',
      'bn-BD', 'উচ্চমানের ইলেকট্রনিক ডিভাইস #' || i || ' যা উন্নত বৈশিষ্ট্য সহ আসে',
      'sv', 'Högkvalitativ elektronisk enhet #' || i || ' med avancerade funktioner'
    ) as description
  FROM electronics_cat c
  CROSS JOIN LATERAL generate_series(1, 100) as i
)
INSERT INTO public.products (category_id, name, slug, description, product_type, is_active)
SELECT
  category_id,
  name,
  slug,
  description,
  CASE WHEN (product_number % 5 = 0) THEN 'digital' ELSE 'physical' END as product_type,
  true as is_active
FROM products_to_insert
ON CONFLICT DO NOTHING;

-- Insert variants for all products
WITH product_variants_to_insert AS (
  SELECT
    p.id as product_id,
    'SKU-' || SUBSTRING(p.id::TEXT, 1, 8) || '-' || ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY p.id) as sku,
    jsonb_build_object(
      'en', 'Standard',
      'bn-BD', 'মান',
      'sv', 'Standard'
    ) as variant_name,
    jsonb_build_object(
      'USD', (random() * 500 + 50)::BIGINT,
      'BDT', (random() * 50000 + 5000)::BIGINT,
      'SEK', (random() * 5000 + 500)::BIGINT
    ) as prices,
    (random() * 100 + 10)::INT as stock_quantity
  FROM public.products p
  WHERE p.slug->>'en' LIKE 'premium-product-%'
  AND NOT EXISTS (SELECT 1 FROM public.product_variants pv WHERE pv.product_id = p.id)
)
INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active)
SELECT
  product_id,
  sku,
  variant_name,
  prices,
  stock_quantity,
  true as is_active
FROM product_variants_to_insert
ON CONFLICT (sku) DO NOTHING;

-- Delete any existing placeholder images
DELETE FROM public.product_images WHERE product_id IN (
  SELECT id FROM public.products WHERE slug->>'en' LIKE 'premium-product-%'
);

-- Insert product images with real Unsplash URLs
WITH product_images_to_insert AS (
  SELECT
    p.id as product_id,
    CASE
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 1) THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 2) THEN 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 3) THEN 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 4) THEN 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 5) THEN 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 6) THEN 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 7) THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 8) THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 9) THEN 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 10) THEN 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 11) THEN 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 12) THEN 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 13) THEN 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 14) THEN 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 15) THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 16) THEN 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 17) THEN 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 18) THEN 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop'
      WHEN (ROW_NUMBER() OVER (ORDER BY p.id) % 20 = 19) THEN 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop'
      ELSE 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop'
    END as image_url,
    jsonb_build_object(
      'en', p.name->>'en',
      'bn-BD', p.name->>'bn-BD',
      'sv', p.name->>'sv'
    ) as alt_text
  FROM public.products p
  WHERE p.slug->>'en' LIKE 'premium-product-%'
)
INSERT INTO public.product_images (product_id, url, alt_text, sort_order)
SELECT
  product_id,
  image_url,
  alt_text,
  0 as sort_order
FROM product_images_to_insert
ON CONFLICT DO NOTHING;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

SELECT
  'Total Products' as statistic,
  (SELECT count(*) FROM public.products)::TEXT as count
UNION ALL
SELECT 'Total Product Variants', (SELECT count(*) FROM public.product_variants)::TEXT
UNION ALL
SELECT 'Total Product Images', (SELECT count(*) FROM public.product_images)::TEXT
UNION ALL
SELECT 'Average Price (USD)',
  (SELECT ROUND(AVG((prices->>'USD')::NUMERIC), 2)::TEXT FROM public.product_variants)
UNION ALL
SELECT 'Products with Images',
  (SELECT count(DISTINCT product_id)::TEXT FROM public.product_images);
