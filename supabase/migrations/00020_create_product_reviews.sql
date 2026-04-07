-- Product reviews & ratings with admin approval
-- Reviews require admin approval before being visible to other visitors
-- Users can always see their own reviews

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)  -- one review per user per product
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(product_id, is_approved) WHERE is_approved = true;

-- RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "already exists" errors on re-run
DROP POLICY IF EXISTS "public_read_approved" ON product_reviews;
DROP POLICY IF EXISTS "own_read" ON product_reviews;
DROP POLICY IF EXISTS "own_insert" ON product_reviews;
DROP POLICY IF EXISTS "own_update" ON product_reviews;
DROP POLICY IF EXISTS "own_delete" ON product_reviews;
DROP POLICY IF EXISTS "admin_all" ON product_reviews;

-- Public: read only approved reviews
CREATE POLICY "public_read_approved" ON product_reviews
  FOR SELECT USING (is_approved = true);

-- Authenticated users can read their own reviews (even unapproved)
CREATE POLICY "own_read" ON product_reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert their own reviews
CREATE POLICY "own_insert" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own reviews
CREATE POLICY "own_update" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated users can delete their own reviews
CREATE POLICY "own_delete" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can do everything
CREATE POLICY "admin_all" ON product_reviews
  FOR ALL USING ((auth.jwt() ->> 'role') IN ('admin', 'administrator', 'store_manager'));

-- Aggregated rating view for products
CREATE OR REPLACE VIEW product_rating_summary AS
SELECT
  product_id,
  COUNT(*)::INT AS review_count,
  ROUND(AVG(rating)::NUMERIC, 1) AS avg_rating,
  COUNT(*) FILTER (WHERE rating = 5)::INT AS five_star,
  COUNT(*) FILTER (WHERE rating = 4)::INT AS four_star,
  COUNT(*) FILTER (WHERE rating = 3)::INT AS three_star,
  COUNT(*) FILTER (WHERE rating = 2)::INT AS two_star,
  COUNT(*) FILTER (WHERE rating = 1)::INT AS one_star
FROM product_reviews
WHERE is_approved = true
GROUP BY product_id;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_updated_at ON product_reviews;
CREATE TRIGGER trg_review_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_updated_at();
