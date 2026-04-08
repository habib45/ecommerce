-- Seed free-shipping threshold per currency (in smallest unit: cents / paisa / öre)
-- Admin can update via Settings page; CartDrawer reads this at runtime.
INSERT INTO public.store_settings (key, value)
VALUES ('free_shipping_threshold', '{"USD": 5000, "BDT": 500000, "SEK": 50000, "EUR": 5000}')
ON CONFLICT (key) DO NOTHING;
