-- Fix: re-create product_reviews RLS policies, indexes, view, and trigger idempotently
-- This migration handles the case where 00020 was partially applied

-- Indexes (safe — IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(product_id, is_approved) WHERE is_approved = true;

-- RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "public_read_approved" ON product_reviews;
DROP POLICY IF EXISTS "own_read" ON product_reviews;
DROP POLICY IF EXISTS "own_insert" ON product_reviews;
DROP POLICY IF EXISTS "own_update" ON product_reviews;
DROP POLICY IF EXISTS "own_delete" ON product_reviews;
DROP POLICY IF EXISTS "admin_all" ON product_reviews;

-- Re-create policies
CREATE POLICY "public_read_approved" ON product_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "own_read" ON product_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_insert" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_update" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_delete" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "admin_all" ON product_reviews
  FOR ALL USING ((auth.jwt() ->> 'role') IN ('admin', 'administrator', 'store_manager'));

-- View (CREATE OR REPLACE — always safe)
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

-- Trigger
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
