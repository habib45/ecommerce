import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useHeroSlides,
  useAllHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
} from '../useHeroSlides';

const getSupabaseMock = async () => {
  const { supabase } = await import('@/lib/supabase/client');
  return supabase;
};

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

const makeSlide = (overrides = {}) => ({
  id: 'slide-1',
  title: 'Hero Title',
  description: 'Desc',
  image_url: 'https://example.com/img.jpg',
  bg_overlay: 'rgba(0,0,0,0.3)',
  cta_label: 'Shop Now',
  cta_href: '/en/products',
  show_text: true,
  show_button: true,
  is_active: true,
  height_px: 600,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useHeroSlides', () => {
  it('returns active slides', async () => {
    const supabase = await getSupabaseMock();
    const slides = [makeSlide()];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: slides, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useHeroSlides(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(slides);
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useHeroSlides(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('DB error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useHeroSlides(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAllHeroSlides', () => {
  it('returns all slides including inactive', async () => {
    const supabase = await getSupabaseMock();
    const slides = [makeSlide(), makeSlide({ id: 'slide-2', is_active: false })];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: slides, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useAllHeroSlides(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useAllHeroSlides(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on fetch error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('all slides error') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useAllHeroSlides(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateHeroSlide', () => {
  it('inserts and returns new slide', async () => {
    const supabase = await getSupabaseMock();
    const newSlide = makeSlide({ id: 'new-slide' });
    const fromMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: newSlide, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCreateHeroSlide(), { wrapper: makeWrapper() });
    const { id: _id, created_at: _c, updated_at: _u, ...insertData } = makeSlide();
    await result.current.mutateAsync(insertData as any);
    expect(fromMock.insert).toHaveBeenCalled();
  });

  it('throws on insert error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('insert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCreateHeroSlide(), { wrapper: makeWrapper() });
    const { id: _id, created_at: _c, updated_at: _u, ...insertData } = makeSlide();
    await expect(result.current.mutateAsync(insertData as any)).rejects.toThrow('insert failed');
  });
});

describe('useUpdateHeroSlide', () => {
  it('updates and returns updated slide', async () => {
    const supabase = await getSupabaseMock();
    const updated = makeSlide({ title: 'Updated Title' });
    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: updated, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateHeroSlide(), { wrapper: makeWrapper() });
    await result.current.mutateAsync({ id: 'slide-1', title: 'Updated Title' });
    expect(fromMock.update).toHaveBeenCalled();
  });

  it('throws on update error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('update failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateHeroSlide(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync({ id: 'slide-1', title: 'X' })).rejects.toThrow('update failed');
  });
});

describe('useDeleteHeroSlide', () => {
  it('deletes slide by id', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useDeleteHeroSlide(), { wrapper: makeWrapper() });
    await result.current.mutateAsync('slide-1');
    expect(fromMock.delete).toHaveBeenCalled();
  });

  it('throws on delete error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: new Error('delete failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useDeleteHeroSlide(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync('slide-1')).rejects.toThrow('delete failed');
  });
});
