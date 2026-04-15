import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useDeliveryFee,
  useUpdateDeliveryFee,
  useFreeShippingThreshold,
  useUpdateFreeShippingThreshold,
  useServiceChargeRate,
  useUpdateServiceChargeRate,
  useAnnouncementBar,
  useUpdateAnnouncementBar,
} from '../useStoreSettings';

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

// ─── Free Shipping Threshold ─────────────────────────────────────────────────

describe('useFreeShippingThreshold', () => {
  it('returns free shipping thresholds from store_settings', async () => {
    const supabase = await getSupabaseMock();
    const thresholds = { USD: 5000, BDT: 500000, SEK: 50000, EUR: 5000 };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { value: thresholds }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useFreeShippingThreshold(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(thresholds);
  });

  it('returns defaults when no value in store_settings', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useFreeShippingThreshold(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ USD: 5000, BDT: 500000, SEK: 50000, EUR: 5000 });
  });
});

describe('useUpdateFreeShippingThreshold', () => {
  it('upserts free shipping thresholds', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateFreeShippingThreshold(), { wrapper: makeWrapper() });
    await result.current.mutateAsync({ USD: 6000, BDT: 600000, SEK: 60000, EUR: 6000 });
    expect(fromMock.upsert).toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: new Error('threshold upsert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateFreeShippingThreshold(), { wrapper: makeWrapper() });
    await expect(
      result.current.mutateAsync({ USD: 6000, BDT: 600000, SEK: 60000, EUR: 6000 }),
    ).rejects.toThrow('threshold upsert failed');
  });
});

// ─── Service Charge Rate ─────────────────────────────────────────────────────

describe('useServiceChargeRate', () => {
  it('returns service charge rate from store_settings', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { value: 300 }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useServiceChargeRate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(300);
  });

  it('returns default 500 when no value in store_settings', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useServiceChargeRate(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(500);
  });
});

describe('useUpdateServiceChargeRate', () => {
  it('upserts service charge rate', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateServiceChargeRate(), { wrapper: makeWrapper() });
    await result.current.mutateAsync(300);
    expect(fromMock.upsert).toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: new Error('rate upsert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateServiceChargeRate(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync(300)).rejects.toThrow('rate upsert failed');
  });
});

// ─── Announcement Bar ────────────────────────────────────────────────────────

describe('useAnnouncementBar', () => {
  it('returns announcement bar from store_settings', async () => {
    const supabase = await getSupabaseMock();
    const bar = { enabled: true, text: { en: 'Welcome!' } };
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: { value: bar }, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useAnnouncementBar(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(bar);
  });

  it('returns default announcement when no value in store_settings', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useAnnouncementBar(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.enabled).toBe(true);
    expect(result.current.data?.text.en).toBeDefined();
  });
});

describe('useUpdateAnnouncementBar', () => {
  it('upserts announcement bar', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const bar = { enabled: false, text: { en: 'Sale!' } };
    const { result } = renderHook(() => useUpdateAnnouncementBar(), { wrapper: makeWrapper() });
    await result.current.mutateAsync(bar);
    expect(fromMock.upsert).toHaveBeenCalled();
  });

  it('throws on upsert error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      upsert: vi.fn().mockResolvedValueOnce({ error: new Error('bar upsert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const bar = { enabled: false, text: { en: 'Sale!' } };
    const { result } = renderHook(() => useUpdateAnnouncementBar(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync(bar)).rejects.toThrow('bar upsert failed');
  });
});
