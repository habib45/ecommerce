-- Allow admins and store managers to view and manage all orders

CREATE POLICY "Admin can view all orders" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );

CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );

CREATE POLICY "Admin can view all order items" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('administrator', 'store_manager')
    )
  );
