-- ========================================
-- UPDATE PRODUCT IMAGES WITH REAL URLS
-- ========================================
-- This script updates all product images with real Unsplash URLs

-- Clear existing product images
DELETE FROM public.product_images WHERE product_id IN (
  SELECT id FROM public.products WHERE slug->>'en' LIKE 'premium-product-%'
);

-- Insert new product images with working URLs
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
FROM product_images_to_insert;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 
  'Product Images Updated' as status,
  (SELECT count(*) FROM public.product_images)::TEXT as total_images
UNION ALL
SELECT 'Products with Images', 
  (SELECT count(DISTINCT product_id) FROM public.product_images)::TEXT;

