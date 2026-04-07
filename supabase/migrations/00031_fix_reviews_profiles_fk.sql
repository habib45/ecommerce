-- Add FK from product_reviews.user_id to profiles.id
-- so PostgREST can resolve the join: product_reviews -> profiles
ALTER TABLE product_reviews
  ADD CONSTRAINT fk_reviews_profile
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
  NOT VALID;

-- Validate separately to avoid locking on large tables
ALTER TABLE product_reviews VALIDATE CONSTRAINT fk_reviews_profile;
