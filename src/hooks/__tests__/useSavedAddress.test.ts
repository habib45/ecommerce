import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSavedAddress } from '../useSavedAddress';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

const makeChain = (resolveWith: { data: unknown; error: unknown }) => {
  const singleFn = vi.fn().mockResolvedValue(resolveWith);
  const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: singleFn };
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
});

describe('useSavedAddress', () => {
  it('does not fetch when user is null (query disabled)', () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useSavedAddress(), { wrapper: makeWrapper() });
    expect(result.current.savedAddress).toBeUndefined();
  });

  it('fetches saved address when user is present', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'user-1' } } as any);
    const address = { full_name: 'John', line1: '123 Main St', city: 'Dhaka', postal_code: '1000', country: 'BD' };
    vi.mocked(supabase.from).mockImplementation(() => makeChain({
      data: { default_shipping_address: address },
      error: null,
    }) as any);

    const { result } = renderHook(() => useSavedAddress(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.savedAddress).not.toBeUndefined());
    expect(result.current.savedAddress).toEqual(address);
  });

  it('returns null when profile has no saved address', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'u1' } } as any);
    vi.mocked(supabase.from).mockImplementation(() => makeChain({
      data: { default_shipping_address: null },
      error: null,
    }) as any);

    const { result } = renderHook(() => useSavedAddress(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.savedAddress).toBeNull());
    expect(result.current.savedAddress).toBeNull();
  });

  it('saveAddress mutates the profile', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'u1' } } as any);
    const updateFn = vi.fn().mockReturnThis();
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const queryChain = makeChain({ data: { default_shipping_address: null }, error: null });
    const mutChain = { update: updateFn, eq: eqFn };

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => queryChain as any)
      .mockImplementationOnce(() => mutChain as any);

    const { result } = renderHook(() => useSavedAddress(), { wrapper: makeWrapper() });
    const address = { full_name: 'Jane', line1: '456 St', city: 'Stockholm', postal_code: '11122', country: 'SE' };
    await result.current.saveAddress.mutateAsync(address);
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ default_shipping_address: address }),
    );
  });

  it('saveAddress returns early when user is null (covers !user branch)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useSavedAddress(), { wrapper: makeWrapper() });
    // Should resolve without error even though user is null
    await expect(result.current.saveAddress.mutateAsync({})).resolves.toBeUndefined();
  });

  it('saveAddress throws when update errors (covers error throw branch)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'u1' } } as any);
    const updateFn = vi.fn().mockReturnThis();
    const eqFn = vi.fn().mockResolvedValue({ error: new Error('update failed') });
    const queryChain = makeChain({ data: { default_shipping_address: null }, error: null });
    const mutChain = { update: updateFn, eq: eqFn };

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => queryChain as any)
      .mockImplementationOnce(() => mutChain as any);

    const { result } = renderHook(() => useSavedAddress(), { wrapper: makeWrapper() });
    await expect(result.current.saveAddress.mutateAsync({})).rejects.toThrow('update failed');
  });
});
