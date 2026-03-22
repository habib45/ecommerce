-- ========================================
-- PART 2: ORDERS & CART
-- ========================================

-- MIGRATION 6: CREATE ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id),
  order_number            TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  status                  TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','payment_confirmed','processing','shipped','delivered','completed','cancelled','refunded')),
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

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
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

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- MIGRATION 7: CREATE CART
CREATE TABLE IF NOT EXISTS public.carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL DEFAULT 'en',
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user ON public.carts(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.carts;
CREATE POLICY "Users can manage own cart" ON public.carts FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id),
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

