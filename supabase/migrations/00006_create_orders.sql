-- BRD §3.7 / §6.1

CREATE TABLE public.orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id),
  order_number            TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  status                  TEXT NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN ('pending_payment','payment_confirmed','processing',
                                            'partially_shipped','shipped','delivered','completed',
                                            'cancelled','refunded','disputed')),
  locale                  TEXT NOT NULL DEFAULT 'en' REFERENCES public.locales(code),
  currency                TEXT NOT NULL DEFAULT 'USD',
  subtotal                BIGINT NOT NULL DEFAULT 0,
  tax                     BIGINT NOT NULL DEFAULT 0,
  shipping                BIGINT NOT NULL DEFAULT 0,
  total                   BIGINT NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  shipping_address        JSONB NOT NULL DEFAULT '{}',
  billing_address         JSONB NOT NULL DEFAULT '{}',
  email                   TEXT NOT NULL DEFAULT '',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id),
  product_name JSONB NOT NULL DEFAULT '{}',
  variant_name JSONB NOT NULL DEFAULT '{}',
  sku         TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  BIGINT NOT NULL DEFAULT 0,
  total       BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- BRD §9.7 — customer can only see own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- BRD §3.7 — atomic inventory decrement
CREATE OR REPLACE FUNCTION public.decrement_inventory(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
