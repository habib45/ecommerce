-- BRD §3.1.2 / §4.6 — per-locale tsvector updated by triggers
-- English: 'english' config; Swedish: 'swedish' config
-- Bangla: 'simple' config with Unicode normalisation (no native PG Bengali dictionary)

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
  -- BRD §3.1.2 — Bangla uses 'simple' config
  NEW.search_vector_bn := to_tsvector('simple',
    COALESCE(NEW.name ->> 'bn-BD', '') || ' ' ||
    COALESCE(NEW.description ->> 'bn-BD', '') || ' ' ||
    COALESCE(NEW.short_description ->> 'bn-BD', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vectors
  BEFORE INSERT OR UPDATE OF name, description, short_description
  ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vectors();

-- Search RPC function (called from frontend)
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
  -- Map locale to tsconfig and column
  CASE search_locale
    WHEN 'en' THEN ts_config := 'english'; vector_col := 'search_vector_en';
    WHEN 'sv' THEN ts_config := 'swedish'; vector_col := 'search_vector_sv';
    WHEN 'bn-BD' THEN ts_config := 'simple'; vector_col := 'search_vector_bn';
    ELSE ts_config := 'english'; vector_col := 'search_vector_en';
  END CASE;

  RETURN QUERY EXECUTE format(
    'SELECT p.id, p.name, p.slug, p.short_description,
            c.name AS category_name,
            MIN((v.prices ->> ''USD'')::BIGINT) AS price_min,
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
