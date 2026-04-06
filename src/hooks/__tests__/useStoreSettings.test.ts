import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDeliveryFee, useUpdateDeliveryFee } from '../useStoreSettings';

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

describe('useDeliveryFee', () => {
  it('returns delivery fee from store_settings', async () => {
    const supabase = await getSupabaseMock();
    const fees = { USD: 500, BDT: 5000, SEK: 5000, EUR: 500 };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { value: fees }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useDeliveryFee(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fees);
  });

  it('returns defaults when store_settings has no value', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useDeliveryFee(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ USD: 500, BDT: 5000, SEK: 5000, EUR: 500 });
  });
});

describe('useUpdateDeliveryFee', () => {
  it('upserts delivery fee', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateDeliveryFee(), { wrapper: makeWrapper() });
    await result.current.mutateAsync({ USD: 600, BDT: 6000, SEK: 6000, EUR: 600 });
    expect(fromMock.upsert).toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: new Error('upsert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateDeliveryFee(), { wrapper: makeWrapper() });
    await expect(
      result.current.mutateAsync({ USD: 600, BDT: 6000, SEK: 6000, EUR: 600 }),
    ).rejects.toThrow('upsert failed');
  });
});
