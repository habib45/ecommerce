import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { CartItem, LocaleCode, CurrencyCode } from '@/types/domain';

interface CartState {
  items: CartItem[];
  cartId: string | null;
  loading: boolean;
  locale: LocaleCode;
  currency: CurrencyCode;

  setLocale: (locale: LocaleCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  loadCart: (userId?: string) => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: (userId: string) => Promise<void>;
  getSubtotal: () => number;
  getItemCount: () => number;
  getOrderSummary: (deliveryCharge?: number) => { subtotal: number; deliveryCharge: number; serviceCharge: number; total: number };
}

const GUEST_CART_KEY = 'ecom_guest_cart';

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]): void {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartId: null,
  loading: false,
  locale: 'en',
  currency: 'USD',

  setLocale: (locale) => set({ locale }),
  setCurrency: (currency) => set({ currency }),

  loadCart: async (userId?: string) => {
    set({ loading: true });

    if (!userId) {
      // BRD §3.5.1 — session cart for guests in localStorage
      const guestItems = loadGuestCart();

      // Fetch variant and product data for guest items
      if (guestItems.length > 0) {
        try {
          const variantIds = guestItems.map(item => item.variant_id);

          // Try to fetch variants with nested product data
          const { data: variants, error } = await supabase
            .from('product_variants')
            .select(`
              id, sku, name, prices, sale_prices, stock_quantity,
              product:products(id, name, slug, images:product_images(url, alt_text, sort_order))
            `)
            .in('id', variantIds);

          if (error) {
            console.error('Failed to fetch variant data:', error);
            // Fallback: use items as-is without variant data
            set({ items: guestItems, loading: false });
            return;
          }

          if (!variants || variants.length === 0) {
            console.warn('No variants returned from query');
            set({ items: guestItems, loading: false });
            return;
          }

          // Merge variant data into guest items
          const itemsWithData = guestItems.map(item => {
            const variant = variants.find(v => v.id === item.variant_id);
            if (!variant) {
              console.warn(`Variant ${item.variant_id} not found in query results`);
            }
            return {
              ...item,
              variant: variant as any,
            };
          });

          console.log('Guest cart loaded:', itemsWithData);
          set({ items: itemsWithData, loading: false });
        } catch (error) {
          console.error('Error loading guest cart:', error);
          set({ items: guestItems, loading: false });
        }
      } else {
        set({ items: [], loading: false });
      }
      return;
    }

    // BRD §3.5.1 — persistent cart for logged-in users in Supabase
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!cart) {
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ user_id: userId, locale: get().locale, currency: get().currency })
        .select('id')
        .single();
      set({ cartId: newCart?.id ?? null, items: [], loading: false });
      return;
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select(`
        id, cart_id, variant_id, quantity,
        variant:product_variants(
          id, sku, name, prices, sale_prices, stock_quantity,
          product:products(id, name, slug, images:product_images(url, alt_text, sort_order))
        )
      `)
      .eq('cart_id', cart.id)
      .order('created_at');

    set({
      cartId: cart.id,
      items: (items ?? []) as unknown as CartItem[],
      loading: false,
    });
  },

  addItem: async (variantId, quantity) => {
    const { cartId, items } = get();

    // BRD §3.5.1 — real-time stock validation on add-to-cart
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (!variant || variant.stock_quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    if (cartId) {
      const existing = items.find((i) => i.variant_id === variantId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        // Optimistic update
        set({ items: items.map((i) => i.id === existing.id ? { ...i, quantity: newQty } : i) });
        await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
      } else {
        const { data: inserted } = await supabase
          .from('cart_items')
          .insert({ cart_id: cartId, variant_id: variantId, quantity })
          .select(`id, cart_id, variant_id, quantity,
            variant:product_variants(id, sku, name, prices, sale_prices, stock_quantity,
              product:products(id, name, slug, images:product_images(url, alt_text, sort_order)))`)
          .single();
        if (inserted) {
          set({ items: [...get().items, inserted as unknown as CartItem] });
        }
      }
    } else {
      // Guest: localStorage (store minimal data, variant data fetched on load)
      const updated = [...items];
      const existing = updated.find((i) => i.variant_id === variantId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        updated.push({
          id: crypto.randomUUID(),
          cart_id: '',
          variant_id: variantId,
          quantity,
        } as CartItem);
      }
      set({ items: updated });
      saveGuestCart(updated);
    }
  },

  updateItemQuantity: async (itemId, quantity) => {
    const { cartId, items } = get();

    if (quantity <= 0) {
      await get().removeItem(itemId);
      return;
    }

    const updated = items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
    set({ items: updated });
    if (cartId) {
      await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    } else {
      saveGuestCart(updated);
    }
  },

  removeItem: async (itemId) => {
    const { cartId, items } = get();
    const updated = items.filter((i) => i.id !== itemId);
    set({ items: updated });
    if (cartId) {
      await supabase.from('cart_items').delete().eq('id', itemId);
    } else {
      saveGuestCart(updated);
    }
  },

  clearCart: async () => {
    const { cartId } = get();
    if (cartId) {
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
    }
    set({ items: [] });
    localStorage.removeItem(GUEST_CART_KEY);
  },

  // BRD §3.5.1 — guest cart merged on login
  mergeGuestCart: async (userId) => {
    const guestItems = loadGuestCart();

    // Clear localStorage immediately to prevent a second concurrent call from
    // reading the same guest items and merging them again.
    localStorage.removeItem(GUEST_CART_KEY);

    await get().loadCart(userId);

    if (guestItems.length === 0) return;

    // Only add guest items that do not already exist in the DB cart.
    // Never increment quantity of existing items — that causes doubling on every login.
    const existingVariantIds = new Set(get().items.map((i) => i.variant_id));
    for (const item of guestItems) {
      if (!existingVariantIds.has(item.variant_id)) {
        await get().addItem(item.variant_id, item.quantity);
      }
    }
  },

  getSubtotal: () => {
    const { items, currency } = get();
    return items.reduce((sum, item) => {
      const variant = item.variant;
      if (!variant) return sum;
      const price = variant.sale_prices?.[currency] ?? variant.prices[currency] ?? 0;
      return sum + price * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getOrderSummary: (deliveryCharge = 0) => {
    const subtotal = get().getSubtotal();
    const serviceCharge = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryCharge + serviceCharge;

    return { subtotal, deliveryCharge, serviceCharge, total };
  },
}));
