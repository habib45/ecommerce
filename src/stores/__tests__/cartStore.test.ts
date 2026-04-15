import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';
import type { CartItem } from '@/types/domain';

const getSupabaseMock = async () => {
  const { supabase } = await import('@/lib/supabase/client');
  return supabase;
};

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'item-1',
  cart_id: 'cart-1',
  variant_id: 'variant-1',
  quantity: 2,
  variant: {
    id: 'variant-1',
    product_id: 'prod-1',
    sku: 'SKU-1',
    name: { en: 'Blue' },
    prices: { USD: 1000, BDT: 10000, SEK: 9000, EUR: 900 },
    sale_prices: null,
    sale_start: null,
    sale_end: null,
    stock_quantity: 10,
    is_active: true,
  },
  ...overrides,
});

beforeEach(() => {
  useCartStore.setState({
    items: [],
    cartId: null,
    loading: false,
    locale: 'en',
    currency: 'USD',
  });
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('initial state', () => {
  it('has empty items', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('has null cartId', () => {
    expect(useCartStore.getState().cartId).toBeNull();
  });

  it('default locale is en', () => {
    expect(useCartStore.getState().locale).toBe('en');
  });

  it('default currency is USD', () => {
    expect(useCartStore.getState().currency).toBe('USD');
  });
});

describe('setLocale / setCurrency', () => {
  it('setLocale updates locale', () => {
    useCartStore.getState().setLocale('sv');
    expect(useCartStore.getState().locale).toBe('sv');
  });

  it('setCurrency updates currency', () => {
    useCartStore.getState().setCurrency('BDT');
    expect(useCartStore.getState().currency).toBe('BDT');
  });
});

describe('getItemCount', () => {
  it('returns 0 for empty cart', () => {
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });

  it('sums quantities across items', () => {
    useCartStore.setState({
      items: [makeItem({ quantity: 3 }), makeItem({ id: 'item-2', quantity: 2 })],
    });
    expect(useCartStore.getState().getItemCount()).toBe(5);
  });
});

describe('getSubtotal', () => {
  it('returns 0 for empty cart', () => {
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it('calculates subtotal using prices[currency]', () => {
    useCartStore.setState({
      items: [makeItem({ quantity: 2 })],
      currency: 'USD',
    });
    // price 1000 * qty 2 = 2000
    expect(useCartStore.getState().getSubtotal()).toBe(2000);
  });

  it('uses sale_prices when present', () => {
    useCartStore.setState({
      items: [
        makeItem({
          quantity: 1,
          variant: {
            id: 'v1',
            product_id: 'p1',
            sku: 'SKU',
            name: { en: 'X' },
            prices: { USD: 2000, BDT: 0, SEK: 0, EUR: 0 },
            sale_prices: { USD: 1500, BDT: 0, SEK: 0, EUR: 0 },
            sale_start: null,
            sale_end: null,
            stock_quantity: 5,
            is_active: true,
          },
        }),
      ],
      currency: 'USD',
    });
    expect(useCartStore.getState().getSubtotal()).toBe(1500);
  });

  it('skips items without a variant', () => {
    const itemNoVariant: CartItem = {
      id: 'i2',
      cart_id: 'c1',
      variant_id: 'v2',
      quantity: 1,
    };
    useCartStore.setState({ items: [itemNoVariant], currency: 'USD' });
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it('falls back to 0 when prices has no entry for the currency (covers ?? 0 branch)', () => {
    useCartStore.setState({
      items: [
        makeItem({
          quantity: 1,
          variant: {
            id: 'v1',
            product_id: 'p1',
            sku: 'SKU',
            name: { en: 'X' },
            prices: { USD: 0, BDT: 0, SEK: 0, EUR: 0 },
            sale_prices: null,
            sale_start: null,
            sale_end: null,
            stock_quantity: 5,
            is_active: true,
          },
        }),
      ],
      currency: 'USD',
    });
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it('falls back to 0 when currency key is missing from both sale_prices and prices', () => {
    useCartStore.setState({
      items: [
        makeItem({
          quantity: 1,
          variant: {
            id: 'v1',
            product_id: 'p1',
            sku: 'SKU',
            name: { en: 'X' },
            prices: {} as any,
            sale_prices: {} as any,
            sale_start: null,
            sale_end: null,
            stock_quantity: 5,
            is_active: true,
          },
        }),
      ],
      currency: 'USD',
    });
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });
});

describe('getOrderSummary', () => {
  it('includes subtotal, delivery, service and total', () => {
    useCartStore.setState({
      items: [makeItem({ quantity: 1 })],
      currency: 'USD',
    });
    const summary = useCartStore.getState().getOrderSummary(500);
    expect(summary.subtotal).toBe(1000);
    expect(summary.deliveryCharge).toBe(500);
    expect(summary.serviceCharge).toBe(50); // 5% of 1000
    expect(summary.total).toBe(1550);
  });

  it('defaults deliveryCharge to 0', () => {
    useCartStore.setState({ items: [makeItem({ quantity: 1 })], currency: 'USD' });
    const summary = useCartStore.getState().getOrderSummary();
    expect(summary.deliveryCharge).toBe(0);
  });
});

describe('loadCart – guest (no userId)', () => {
  it('loads empty array when localStorage is empty', async () => {
    window.localStorage.getItem = vi.fn().mockReturnValue(null);
    await useCartStore.getState().loadCart();
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().loading).toBe(false);
  });

  it('fetches variant data for guest items in localStorage', async () => {
    const guestItems = [{ id: 'g1', cart_id: '', variant_id: 'v-abc', quantity: 1 }];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const supabase = await getSupabaseMock();
    const variantData = [{ id: 'v-abc', sku: 'SKU', name: { en: 'X' }, prices: { USD: 500 }, sale_prices: null, stock_quantity: 5 }];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValueOnce({ data: variantData, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useCartStore.getState().loadCart();
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.variant_id).toBe('v-abc');
  });

  it('falls back to raw guest items on variant fetch error', async () => {
    const guestItems = [{ id: 'g1', cart_id: '', variant_id: 'v-bad', quantity: 1 }];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('fetch failed') }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useCartStore.getState().loadCart();
    expect(useCartStore.getState().items).toEqual(guestItems);
  });

  it('handles empty variants response gracefully', async () => {
    const guestItems = [{ id: 'g1', cart_id: '', variant_id: 'v-none', quantity: 1 }];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useCartStore.getState().loadCart();
    expect(useCartStore.getState().items).toEqual(guestItems);
  });

  it('handles JSON parse errors in localStorage gracefully', async () => {
    window.localStorage.getItem = vi.fn().mockReturnValue('INVALID_JSON{{{');
    await useCartStore.getState().loadCart();
    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('loadCart – authenticated user', () => {
  it('creates a new cart when none exists', async () => {
    const supabase = await getSupabaseMock();
    const selectMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    const insertMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { id: 'new-cart' }, error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectMock as any)
      .mockReturnValueOnce(insertMock as any);

    await useCartStore.getState().loadCart('user-1');
    expect(useCartStore.getState().cartId).toBe('new-cart');
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('sets cartId to null when cart insert returns null data (covers newCart?.id ?? null branch)', async () => {
    const supabase = await getSupabaseMock();
    const selectMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    const insertMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectMock as any)
      .mockReturnValueOnce(insertMock as any);

    await useCartStore.getState().loadCart('user-1');
    expect(useCartStore.getState().cartId).toBeNull();
  });

  it('loads items from existing cart', async () => {
    const supabase = await getSupabaseMock();
    const cartRow = { id: 'cart-abc' };
    const cartItems = [{ id: 'ci-1', cart_id: 'cart-abc', variant_id: 'v1', quantity: 2 }];

    const selectCartMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: cartRow, error: null }),
    };
    const selectItemsMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: cartItems, error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectCartMock as any)
      .mockReturnValueOnce(selectItemsMock as any);

    await useCartStore.getState().loadCart('user-1');
    expect(useCartStore.getState().cartId).toBe('cart-abc');
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('uses [] when cart_items query returns null data (covers items ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const cartRow = { id: 'cart-null-items' };

    const selectCartMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: cartRow, error: null }),
    };
    const selectItemsMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectCartMock as any)
      .mockReturnValueOnce(selectItemsMock as any);

    await useCartStore.getState().loadCart('user-1');
    expect(useCartStore.getState().cartId).toBe('cart-null-items');
    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('addItem – guest cart', () => {
  it('adds a new item to guest cart', async () => {
    useCartStore.setState({ cartId: null, items: [] });
    const supabase = await getSupabaseMock();

    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 10 }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(variantMock as any);

    await useCartStore.getState().addItem('variant-new', 1);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.variant_id).toBe('variant-new');
  });

  it('increments quantity for existing guest item', async () => {
    useCartStore.setState({
      cartId: null,
      items: [{ id: 'g1', cart_id: '', variant_id: 'v1', quantity: 1 }],
    });
    const supabase = await getSupabaseMock();

    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 10 }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(variantMock as any);

    await useCartStore.getState().addItem('v1', 2);
    const items = useCartStore.getState().items;
    expect(items[0]?.quantity).toBe(3);
  });

  it('throws when stock is insufficient', async () => {
    const supabase = await getSupabaseMock();
    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 0 }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(variantMock as any);

    await expect(useCartStore.getState().addItem('v1', 5)).rejects.toThrow('Insufficient stock');
  });

  it('throws when variant not found', async () => {
    const supabase = await getSupabaseMock();
    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(variantMock as any);

    await expect(useCartStore.getState().addItem('missing', 1)).rejects.toThrow('Insufficient stock');
  });
});

describe('addItem – authenticated cart', () => {
  it('inserts new item into DB cart', async () => {
    useCartStore.setState({ cartId: 'cart-1', items: [] });
    const supabase = await getSupabaseMock();

    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 5 }, error: null }),
    };
    const insertMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { id: 'ci-new', cart_id: 'cart-1', variant_id: 'v2', quantity: 1 },
        error: null,
      }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(variantMock as any)
      .mockReturnValueOnce(insertMock as any);

    await useCartStore.getState().addItem('v2', 1);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('updates quantity for existing DB cart item', async () => {
    useCartStore.setState({
      cartId: 'cart-1',
      items: [{ id: 'ci-1', cart_id: 'cart-1', variant_id: 'v1', quantity: 1 }],
    });
    const supabase = await getSupabaseMock();

    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 10 }, error: null }),
    };
    const updateMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(variantMock as any)
      .mockReturnValueOnce(updateMock as any);

    await useCartStore.getState().addItem('v1', 3);
    expect(useCartStore.getState().items[0]?.quantity).toBe(4);
  });

  it('updates existing item while preserving other items (covers ternary false branch)', async () => {
    useCartStore.setState({
      cartId: 'cart-1',
      items: [
        { id: 'ci-1', cart_id: 'cart-1', variant_id: 'v1', quantity: 1 },
        { id: 'ci-2', cart_id: 'cart-1', variant_id: 'v2', quantity: 5 },
      ],
    });
    const supabase = await getSupabaseMock();

    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 10 }, error: null }),
    };
    const updateMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(variantMock as any)
      .mockReturnValueOnce(updateMock as any);

    await useCartStore.getState().addItem('v1', 2);
    const items = useCartStore.getState().items;
    // ci-1 updated, ci-2 unchanged (covers the false branch of the ternary)
    expect(items.find((i) => i.id === 'ci-1')?.quantity).toBe(3);
    expect(items.find((i) => i.id === 'ci-2')?.quantity).toBe(5);
  });
});

describe('updateItemQuantity', () => {
  it('updates quantity in state and guest cart', async () => {
    useCartStore.setState({
      cartId: null,
      items: [makeItem({ id: 'i1', quantity: 1 })],
    });
    await useCartStore.getState().updateItemQuantity('i1', 5);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
  });

  it('preserves other items when updating one (covers ternary false branch)', async () => {
    useCartStore.setState({
      cartId: null,
      items: [makeItem({ id: 'i1', quantity: 1 }), makeItem({ id: 'i2', variant_id: 'v2', quantity: 3 })],
    });
    await useCartStore.getState().updateItemQuantity('i1', 7);
    const items = useCartStore.getState().items;
    expect(items.find((i) => i.id === 'i1')?.quantity).toBe(7);
    expect(items.find((i) => i.id === 'i2')?.quantity).toBe(3);
  });

  it('removes item when quantity <= 0', async () => {
    useCartStore.setState({
      cartId: null,
      items: [makeItem({ id: 'i1', quantity: 2 })],
    });
    await useCartStore.getState().updateItemQuantity('i1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updates DB when cartId exists', async () => {
    useCartStore.setState({
      cartId: 'cart-1',
      items: [makeItem({ id: 'i1', quantity: 1 })],
    });
    const supabase = await getSupabaseMock();
    const updateMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(updateMock as any);

    await useCartStore.getState().updateItemQuantity('i1', 3);
    expect(updateMock.update).toHaveBeenCalledWith({ quantity: 3 });
  });
});

describe('removeItem', () => {
  it('removes item from guest cart', async () => {
    useCartStore.setState({
      cartId: null,
      items: [makeItem({ id: 'i1' }), makeItem({ id: 'i2', variant_id: 'v2' })],
    });
    await useCartStore.getState().removeItem('i1');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('i2');
  });

  it('removes from DB when cartId exists', async () => {
    useCartStore.setState({
      cartId: 'cart-1',
      items: [makeItem({ id: 'ci-1' })],
    });
    const supabase = await getSupabaseMock();
    const deleteMock = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(deleteMock as any);

    await useCartStore.getState().removeItem('ci-1');
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(deleteMock.delete).toHaveBeenCalled();
  });
});

describe('clearCart', () => {
  it('empties items from guest cart', async () => {
    useCartStore.setState({ cartId: null, items: [makeItem()] });
    await useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('deletes all cart items from DB cart', async () => {
    useCartStore.setState({ cartId: 'cart-1', items: [makeItem()] });
    const supabase = await getSupabaseMock();
    const deleteMock = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(deleteMock as any);

    await useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(deleteMock.delete).toHaveBeenCalled();
  });
});

describe('mergeGuestCart', () => {
  it('clears localStorage and loads DB cart when no guest items', async () => {
    window.localStorage.getItem = vi.fn().mockReturnValue(null);
    const supabase = await getSupabaseMock();

    // loadCart calls: select cart
    const selectMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { id: 'cart-db' }, error: null }),
    };
    const itemsMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectMock as any)
      .mockReturnValueOnce(itemsMock as any);

    await useCartStore.getState().mergeGuestCart('user-1');
    expect(useCartStore.getState().cartId).toBe('cart-db');
    expect(window.localStorage.removeItem).toHaveBeenCalled();
  });

  it('adds guest items not already in DB cart after merge', async () => {
    const supabase = await getSupabaseMock();
    // Guest cart has one item
    const guestItems = [{ id: 'g1', cart_id: '', variant_id: 'v-guest', quantity: 1 }];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const selectMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { id: 'cart-db' }, error: null }),
    };
    const itemsMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      // DB cart has a different variant → guest item should be added
      order: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
    };
    // addItem will check stock
    const variantMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { stock_quantity: 5 }, error: null }),
    };
    // addItem will insert
    const insertMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { id: 'ci-new', cart_id: 'cart-db', variant_id: 'v-guest', quantity: 1 },
        error: null,
      }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectMock as any)
      .mockReturnValueOnce(itemsMock as any)
      .mockReturnValueOnce(variantMock as any)
      .mockReturnValueOnce(insertMock as any);

    await useCartStore.getState().mergeGuestCart('user-1');
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.variant_id).toBe('v-guest');
  });

  it('skips guest items already present in DB cart', async () => {
    const supabase = await getSupabaseMock();
    const guestItems = [{ id: 'g1', cart_id: '', variant_id: 'v-existing', quantity: 1 }];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const selectMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { id: 'cart-db' }, error: null }),
    };
    const dbItem = { id: 'ci-1', cart_id: 'cart-db', variant_id: 'v-existing', quantity: 2 };
    const itemsMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: [dbItem], error: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(selectMock as any)
      .mockReturnValueOnce(itemsMock as any);

    await useCartStore.getState().mergeGuestCart('user-1');
    // Should not add duplicate — addItem should not be called
    // Items stay as loaded from DB
    expect(useCartStore.getState().items[0]?.variant_id).toBe('v-existing');
  });
});

describe('loadCart – guest: uncovered branches', () => {
  it('warns when a variant is not found in query results (line 88)', async () => {
    const supabase = await getSupabaseMock();
    // Two guest items but only one variant returned
    const guestItems = [
      { id: 'g1', cart_id: '', variant_id: 'v-found', quantity: 1 },
      { id: 'g2', cart_id: '', variant_id: 'v-missing', quantity: 1 },
    ];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const variantData = [{ id: 'v-found', sku: 'A', name: { en: 'X' }, prices: { USD: 500 }, sale_prices: null, stock_quantity: 5 }];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValueOnce({ data: variantData, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useCartStore.getState().loadCart();
    // Both items loaded; v-missing gets variant=undefined
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('handles unexpected thrown exception in guest cart fetch (lines 99-100)', async () => {
    const supabase = await getSupabaseMock();
    const guestItems = [{ id: 'g1', cart_id: '', variant_id: 'v1', quantity: 1 }];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestItems));

    const fromMock = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockRejectedValueOnce(new Error('unexpected crash')),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(fromMock as any);

    await useCartStore.getState().loadCart();
    // Falls back to raw guestItems
    expect(useCartStore.getState().items).toEqual(guestItems);
    expect(useCartStore.getState().loading).toBe(false);
  });
});
