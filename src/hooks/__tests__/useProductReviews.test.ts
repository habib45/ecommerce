import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useProductReviews,
  useProductRatingSummary,
  useUserReview,
  useSubmitReview,
} from '../useProductReviews';

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

// ─── useProductReviews ───────────────────────────────────────────────────────

describe('useProductReviews', () => {
  it('returns reviews with user_name mapped from profile', async () => {
    const supabase = await getSupabaseMock();
    const rows = [
      { id: 'r1', product_id: 'p1', rating: 5, title: 'Great', body: 'Loved it', user: { full_name: 'Alice' } },
      { id: 'r2', product_id: 'p1', rating: 3, title: 'OK', body: 'Fine', user: { full_name: 'Bob' } },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: rows, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductReviews('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]!.user_name).toBe('Alice');
    expect(result.current.data![1]!.user_name).toBe('Bob');
  });

  it('falls back to Anonymous when user.full_name is null', async () => {
    const supabase = await getSupabaseMock();
    const rows = [
      { id: 'r1', product_id: 'p1', rating: 4, title: 'Good', body: 'Nice', user: null },
    ];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: rows, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductReviews('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0]!.user_name).toBe('Anonymous');
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductReviews('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on query error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductReviews('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('is disabled when productId is empty', () => {
    const { result } = renderHook(() => useProductReviews(''), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useProductRatingSummary ─────────────────────────────────────────────────

describe('useProductRatingSummary', () => {
  it('returns rating summary when found', async () => {
    const supabase = await getSupabaseMock();
    const summary = { product_id: 'p1', average_rating: 4.5, review_count: 10 };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: summary, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductRatingSummary('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });

  it('returns null when no summary exists', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductRatingSummary('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('throws on query error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('summary error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useProductRatingSummary('p1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('is disabled when productId is empty', () => {
    const { result } = renderHook(() => useProductRatingSummary(''), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useUserReview ───────────────────────────────────────────────────────────

describe('useUserReview', () => {
  it('returns the user review when found', async () => {
    const supabase = await getSupabaseMock();
    const review = { id: 'r1', product_id: 'p1', user_id: 'u1', rating: 5, title: 'Love it', body: 'Amazing' };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: review, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUserReview('p1', 'u1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(review);
  });

  it('returns null when no review exists', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUserReview('p1', 'u1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('throws on query error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('user review error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUserReview('p1', 'u1'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('is disabled when productId is empty', () => {
    const { result } = renderHook(() => useUserReview('', 'u1'), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useUserReview('p1', undefined), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ─── useSubmitReview ─────────────────────────────────────────────────────────

describe('useSubmitReview', () => {
  const reviewPayload = { product_id: 'p1', rating: 5, title: 'Great', body: 'Loved it' };

  it('submits review successfully when user is authenticated', async () => {
    const supabase = await getSupabaseMock();
    const savedReview = { id: 'r1', ...reviewPayload, user_id: 'u1' };

    // Mock auth.getUser
    (supabase.auth as any).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1' } },
    });

    // Mock upsert chain
    const fromMock = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: savedReview, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useSubmitReview(), { wrapper: makeWrapper() });
    result.current.mutate(reviewPayload);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(savedReview);
  });

  it('throws when user is not authenticated', async () => {
    const supabase = await getSupabaseMock();

    // Mock auth.getUser returning no user
    (supabase.auth as any).getUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useSubmitReview(), { wrapper: makeWrapper() });
    result.current.mutate(reviewPayload);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });

  it('throws when upsert errors', async () => {
    const supabase = await getSupabaseMock();

    // Mock auth.getUser — authenticated
    (supabase.auth as any).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1' } },
    });

    // Mock upsert chain with error
    const fromMock = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('upsert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useSubmitReview(), { wrapper: makeWrapper() });
    result.current.mutate(reviewPayload);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('invalidates query keys on success', async () => {
    const supabase = await getSupabaseMock();
    const savedReview = { id: 'r1', ...reviewPayload, user_id: 'u1' };

    (supabase.auth as any).getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1' } },
    });

    const fromMock = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: savedReview, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useSubmitReview(), { wrapper });
    result.current.mutate(reviewPayload);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['product-reviews', 'p1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['product-rating-summary', 'p1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user-review', 'p1'] });
  });
});
