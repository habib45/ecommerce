import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useContentBlocks,
  useActiveContentBlocks,
  useCreateContentBlock,
  useUpdateContentBlock,
  useDeleteContentBlock,
} from '../useContentBlocks';
import type { ContentBlock } from '@/types/domain';

const getSupabaseMock = async () => {
  const { supabase } = await import('@/lib/supabase/client');
  return supabase;
};

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

const makeBlock = (overrides: Partial<ContentBlock> = {}): ContentBlock => ({
  id: 'block-1',
  type: 'banner',
  name: { en: 'Test Banner' },
  body: { en: 'Body content' },
  cta_label: { en: 'Click Here' },
  cta_url: { en: '/en/products' },
  image_url: null,
  sort_order: 0,
  is_active: true,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useContentBlocks', () => {
  it('fetches content blocks by type', async () => {
    const supabase = await getSupabaseMock();
    const blocks = [makeBlock()];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: blocks, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useContentBlocks('banner'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(blocks);
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useContentBlocks('banner'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on fetch error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('fetch fail') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useContentBlocks('banner'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useActiveContentBlocks', () => {
  it('filters only active blocks', async () => {
    const supabase = await getSupabaseMock();
    const blocks = [makeBlock({ is_active: true })];
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: blocks, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useActiveContentBlocks('banner'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(blocks);
  });

  it('returns empty array when data is null (covers ?? [] branch)', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useActiveContentBlocks('banner'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on fetch error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('active fetch fail') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useActiveContentBlocks('banner'), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateContentBlock', () => {
  it('inserts and returns new block', async () => {
    const supabase = await getSupabaseMock();
    const newBlock = makeBlock({ id: 'block-new' });
    const fromMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: newBlock, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCreateContentBlock(), { wrapper: makeWrapper() });
    const { id: _id, ...insertData } = makeBlock();
    const created = await result.current.mutateAsync(insertData);
    expect(created).toEqual(newBlock);
  });

  it('throws on insert error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: null, error: new Error('insert failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useCreateContentBlock(), { wrapper: makeWrapper() });
    const { id: _id, ...insertData } = makeBlock();
    await expect(result.current.mutateAsync(insertData)).rejects.toThrow('insert failed');
  });
});

describe('useUpdateContentBlock', () => {
  it('updates and returns updated block', async () => {
    const supabase = await getSupabaseMock();
    const updated = makeBlock({ body: { en: 'Updated body' } });
    const fromMock = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ data: updated, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useUpdateContentBlock(), { wrapper: makeWrapper() });
    const patched = await result.current.mutateAsync({ id: 'block-1', body: { en: 'Updated body' } });
    expect(patched).toEqual(updated);
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

    const { result } = renderHook(() => useUpdateContentBlock(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync({ id: 'block-1', body: { en: 'Bad' } })).rejects.toThrow('update failed');
  });
});

describe('useDeleteContentBlock', () => {
  it('deletes block by id', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useDeleteContentBlock(), { wrapper: makeWrapper() });
    await result.current.mutateAsync('block-1');
    expect(fromMock.delete).toHaveBeenCalled();
  });

  it('throws on delete error', async () => {
    const supabase = await getSupabaseMock();
    const fromMock = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: new Error('delete failed') }),
    };
    vi.mocked(supabase.from).mockReturnValue(fromMock as any);

    const { result } = renderHook(() => useDeleteContentBlock(), { wrapper: makeWrapper() });
    await expect(result.current.mutateAsync('block-1')).rejects.toThrow('delete failed');
  });
});
