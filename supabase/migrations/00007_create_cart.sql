-- BRD §3.5.1

CREATE TABLE public.carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL DEFAULT 'en',
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id),
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cart_user ON public.carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart" ON public.carts FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL
  USING (cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid()));

-- Enable Realtime for cart sync (BRD §3.5.1)
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
