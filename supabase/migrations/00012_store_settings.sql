CREATE TABLE public.store_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Public read (cart needs delivery fee without auth)
CREATE POLICY "Public can read settings" ON public.store_settings FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admin can manage settings" ON public.store_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );

-- Seed default delivery fees (in smallest currency unit)
INSERT INTO public.store_settings (key, value) VALUES
  ('delivery_fee', '{"USD": 500, "BDT": 5000, "SEK": 5000, "EUR": 500}');
