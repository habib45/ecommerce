CREATE TABLE public.shipping_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Home',
  is_default    BOOLEAN NOT NULL DEFAULT false,
  full_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  line1         TEXT NOT NULL DEFAULT '',
  line2         TEXT,
  city          TEXT,
  state_province TEXT,
  district      TEXT,
  thana         TEXT,
  postort       TEXT,
  postal_code   TEXT,
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON public.shipping_addresses FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_shipping_addresses_user ON public.shipping_addresses(user_id);
