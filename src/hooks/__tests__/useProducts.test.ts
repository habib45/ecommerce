import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useProduct,
  useFeaturedProducts,
  useProducts,
  useProductSearch,
  useCategories,
  useRelatedProducts,
} from '../useProducts';

const getSupabaseMock = async () => {
  const { supabase } = await import('@/lib/supabase/client');
  return supabase;
};

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useProduct', () => {
  it('returns a product when found', async () => {
    const supabase = await getSupabaseMock();
    const product = { id: 'p1', name: { en: 'Shirt' }, category_id: 'cat-1' };
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [product], error: null } as any);

    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'cat-1', name: { en: 'Tops' } }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProduct('blue-shirt', 'en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('p1');
  });

  it('throws when product not found', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as any);

    const { result } = renderHook(() => useProduct('no-slug', 'en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Product not found');
  });

  it('does not fetch when slug is empty', () => {
    const { result } = renderHook(() => useProduct('', 'en'), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('throws when rpc errors', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: new Error('RPC failed') } as any);

    const { result } = renderHook(() => useProduct('some-slug', 'en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useFeaturedProducts', () => {
  it('returns featured products', async () => {
    const supabase = await getSupabaseMock();
    const products = [{ id: 'p1', name: { en: 'Featured' } }];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce({ data: products, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useFeaturedProducts('en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('throws on error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useFeaturedProducts('en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useProducts – basic (no filters)', () => {
  it('returns paginated product list', async () => {
    const supabase = await getSupabaseMock();
    const products = [{ id: 'p1' }, { id: 'p2' }];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.total).toBe(2);
  });

  it('applies search query filter', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', searchQuery: 'shirt' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fromMock.or).toHaveBeenCalled();
  });

  it('sorts by name client-side', async () => {
    const supabase = await getSupabaseMock();
    const products = [
      { id: 'p2', name: { en: 'Zebra' } },
      { id: 'p1', name: { en: 'Apple' } },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'name' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const sorted = result.current.data!.data;
    expect(sorted[0]?.id).toBe('p1');
    expect(sorted[1]?.id).toBe('p2');
  });

  it('sorts by name with both items missing locale (covers both || "" branches)', async () => {
    const supabase = await getSupabaseMock();
    // Both products have no 'en' name — both nameA and nameB fall back to ''
    const products = [
      { id: 'p1', name: {} },
      { id: 'p2', name: {} },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'name' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.data).toHaveLength(2);
  });

  it('throws on error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB fail'), count: 0 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('uses default sort (covers switch default branch) with sortBy=price_asc', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: 0 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'price_asc' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([]);
  });

  it('sorts products by price_asc client-side', async () => {
    const supabase = await getSupabaseMock();
    const products = [
      { id: 'p1', name: { en: 'Expensive' }, variants: [{ id: 'v1', prices: { USD: 3000 }, sale_prices: null }] },
      { id: 'p2', name: { en: 'Cheap' }, variants: [{ id: 'v2', prices: { USD: 1000 }, sale_prices: null }] },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'price_asc' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].id).toBe('p2');
    expect(result.current.data?.data[1].id).toBe('p1');
  });

  it('sorts products by price_desc client-side', async () => {
    const supabase = await getSupabaseMock();
    const products = [
      { id: 'p1', name: { en: 'Cheap' }, variants: [{ id: 'v1', prices: { USD: 1000 }, sale_prices: null }] },
      { id: 'p2', name: { en: 'Expensive' }, variants: [{ id: 'v2', prices: { USD: 3000 }, sale_prices: null }] },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'price_desc' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].id).toBe('p2');
    expect(result.current.data?.data[1].id).toBe('p1');
  });

  it('uses sale_prices for sorting when present', async () => {
    const supabase = await getSupabaseMock();
    const products = [
      { id: 'p1', name: { en: 'A' }, variants: [{ id: 'v1', prices: { USD: 5000 }, sale_prices: { USD: 500 } }] },
      { id: 'p2', name: { en: 'B' }, variants: [{ id: 'v2', prices: { USD: 1000 }, sale_prices: null }] },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'price_asc' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // p1 sale_price 500 < p2 regular price 1000
    expect(result.current.data?.data[0].id).toBe('p1');
  });

  it('falls back to 0 when product has no variants (covers ?? 0 branch in price sort)', async () => {
    const supabase = await getSupabaseMock();
    const products = [
      { id: 'p1', name: { en: 'A' }, variants: [] },
      { id: 'p2', name: { en: 'B' }, variants: [{ id: 'v2', prices: { USD: 1000 }, sale_prices: null }] },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 2 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', sortBy: 'price_asc' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // p1 has no variants → price = 0, should come first for price_asc
    expect(result.current.data?.data[0].id).toBe('p1');
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: null, error: null, count: 0 }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([]);
  });

  it('uses 0 when count is null in default path (covers count ?? 0 branches)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: [], error: null, count: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(0);
    expect(result.current.data?.total_pages).toBe(0);
  });
});

describe('useProducts – with categorySlug', () => {
  it('resolves category and filters by category_id', async () => {
    const supabase = await getSupabaseMock();
    const catRow = { id: 'cat-1' };
    const products = [{ id: 'p1' }];

    const catMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: catRow, error: null }),
    };
    const prodMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: products, error: null, count: 1 }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(catMock as any)
      .mockReturnValueOnce(prodMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', categorySlug: 'tops' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
  });

  it('throws when products query errors after finding category (covers line 130)', async () => {
    const supabase = await getSupabaseMock();
    const catRow = { id: 'cat-1' };
    const catMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: catRow, error: null }),
    };
    const prodMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('products query error'), count: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(catMock as any)
      .mockReturnValueOnce(prodMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', categorySlug: 'tops' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('throws when category not found', async () => {
    const supabase = await getSupabaseMock();
    const catMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('cat not found') }),
    };
    vi.mocked(supabase.from).mockReturnValueOnce(catMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', categorySlug: 'missing' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('uses 0 when count is null in categorySlug path (covers count ?? 0 branch)', async () => {
    const supabase = await getSupabaseMock();
    const catRow = { id: 'cat-1' };
    const catMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: catRow, error: null }),
    };
    const prodMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValueOnce({ data: null, error: null, count: null }),
    };
    vi.mocked(supabase.from)
      .mockReturnValueOnce(catMock as any)
      .mockReturnValueOnce(prodMock as any);

    const { result } = renderHook(
      () => useProducts({ locale: 'en', categorySlug: 'tops' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(0);
    expect(result.current.data?.data).toEqual([]);
  });
});

describe('useProductSearch', () => {
  it('returns search results', async () => {
    const supabase = await getSupabaseMock();
    const results = [{ id: 'p1', name: { en: 'Shirt' } }];
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: results, error: null } as any);

    const { result } = renderHook(() => useProductSearch('shirt', 'en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('returns empty array for empty query', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as any);

    const { result } = renderHook(() => useProductSearch('   ', 'en'), { wrapper: makeWrapper() });
    // Disabled when query is empty/whitespace
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns empty array when rpc data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as any);

    const { result } = renderHook(() => useProductSearch('shirt', 'en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws when rpc errors (covers if(error) throw branch)', async () => {
    const supabase = await getSupabaseMock();
    (supabase as any).rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'search failed' } });

    const { result } = renderHook(() => useProductSearch('shirt', 'en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCategories', () => {
  it('returns active categories', async () => {
    const supabase = await getSupabaseMock();
    const categories = [{ id: 'cat-1', name: { en: 'Tops' } }];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: categories, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCategories('en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('throws on error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('fail') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCategories('en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCategories('en'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useRelatedProducts', () => {
  it('throws on fetch error', async () => {
    const supabase = await getSupabaseMock();
    const { createChainableMock } = await import('@/test/createChainableMock');
    const fromMock = createChainableMock({ data: null, error: new Error('related error') });
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useRelatedProducts('p1', 'cat-1', 'en'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const { createChainableMock } = await import('@/test/createChainableMock');
    const fromMock = createChainableMock({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useRelatedProducts('p1', 'cat-1', 'en'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('returns related products in same category', async () => {
    const supabase = await getSupabaseMock();
    const products = [{ id: 'p2' }, { id: 'p3' }];
    const { createChainableMock } = await import('@/test/createChainableMock');
    const fromMock = createChainableMock({ data: products, error: null });
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useRelatedProducts('p1', 'cat-1', 'en'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('fetches without category filter when categoryId is null', async () => {
    const supabase = await getSupabaseMock();
    const { createChainableMock } = await import('@/test/createChainableMock');
    const fromMock = createChainableMock({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(
      () => useRelatedProducts('p1', null, 'en'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(vi.mocked(fromMock.eq as ReturnType<typeof vi.fn>)).not.toHaveBeenCalledWith('category_id', expect.anything());
  });

  it('is disabled when productId is empty', () => {
    const { result } = renderHook(
      () => useRelatedProducts('', 'cat-1', 'en'),
      { wrapper: makeWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
  });
});
