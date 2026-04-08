-- Seed announcement bar setting (admin-toggleable top banner)
INSERT INTO public.store_settings (key, value)
VALUES (
  'announcement_bar',
  '{"enabled": true, "text": {"en": "Free shipping on orders over $50 • 30-day returns", "bn-BD": "$50-এর বেশি অর্ডারে বিনামূল্যে শিপিং • 30 দিনের রিটার্ন", "sv": "Fri frakt på beställningar över 500 kr • 30 dagars retur"}}'
)
ON CONFLICT (key) DO NOTHING;
