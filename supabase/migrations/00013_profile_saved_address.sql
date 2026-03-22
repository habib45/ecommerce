ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_shipping_address JSONB;
