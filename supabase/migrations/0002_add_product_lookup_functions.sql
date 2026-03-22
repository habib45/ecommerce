-- Add RPC functions for proper locale-specific product lookups

-- Get product by locale-specific slug
CREATE OR REPLACE FUNCTION get_product_by_slug(
  p_slug TEXT,
  p_locale TEXT
)
RETURNS TABLE (
  id UUID,
  name JSONB,
  slug JSONB,
  short_description JSONB,
  description JSONB,
  meta_title JSONB,
  meta_description JSONB,
  category_id UUID,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.description,
    p.meta_title,
    p.meta_description,
    p.category_id,
    p.is_active,
    p.is_featured,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.is_active = true
    AND p.slug ->> p_locale = p_slug;
END;
$$ LANGUAGE plpgsql;

-- Get products by category slug (locale-specific)
CREATE OR REPLACE FUNCTION get_products_by_category_slug(
  p_category_slug TEXT,
  p_locale TEXT,
  p_limit INT DEFAULT 24,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name JSONB,
  slug JSONB,
  short_description JSONB,
  category_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.short_description,
    p.category_id,
    p.is_active,
    p.created_at,
    COUNT(*) OVER () as total_count
  FROM public.products p
  INNER JOIN public.categories c ON p.category_id = c.id
  WHERE p.is_active = true
    AND c.is_active = true
    AND c.slug ->> p_locale = p_category_slug
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
