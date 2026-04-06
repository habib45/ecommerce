import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useShippingAddresses } from '../useShippingAddresses';

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

/** Returns a chainable mock ending in .order().order() resolving with `result` */
const makeQueryChain = (data: unknown) => {
  // second .order() call ends the chain and resolves
  let orderCallCount = 0;
  const smartOrder = vi.fn().mockImplementation(() => {
    orderCallCount++;
    if (orderCallCount >= 2) {
      return Promise.resolve({ data, error: null });
    }
    return chain;
  });
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: smartOrder,
  };
  return chain;
};

const makeAddress = (overrides = {}) => ({
  id: 'addr-1',
  label: 'Home',
  is_default: true,
  full_name: 'John',
  line1: '123 Main',
  city: 'Dhaka',
  postal_code: '1000',
  country: 'BD',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({ user: { id: 'u1' } } as any);
});

describe('useShippingAddresses', () => {
  it('returns empty array when user is null', () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    expect(result.current.addresses).toEqual([]);
  });

  it('fetches and returns addresses', async () => {
    const addresses = [makeAddress(), makeAddress({ id: 'addr-2', is_default: false })];
    vi.mocked(supabase.from).mockImplementationOnce(() => makeQueryChain(addresses) as any);

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.addresses).toHaveLength(2);
  });

  it('throws on fetch error (covers if(error) throw branch)', async () => {
    let orderCallCount = 0;
    const errorOrder = vi.fn().mockImplementation(() => {
      orderCallCount++;
      if (orderCallCount >= 2) {
        return Promise.resolve({ data: null, error: new Error('fetch failed') });
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: errorOrder };
    });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: errorOrder };
    vi.mocked(supabase.from).mockImplementationOnce(() => chain as any);

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // When query errors, addresses defaults to []
    expect(result.current.addresses).toEqual([]);
  });

  it('returns empty array when fetch data is null (covers data ?? [] branch)', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => makeQueryChain(null) as any);

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.addresses).toEqual([]);
  });

  it('defaultAddress is the address with is_default=true', async () => {
    const addresses = [
      makeAddress({ id: 'addr-1', is_default: false }),
      makeAddress({ id: 'addr-2', is_default: true }),
    ];
    vi.mocked(supabase.from).mockImplementationOnce(() => makeQueryChain(addresses) as any);

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultAddress?.id).toBe('addr-2');
  });

  it('addAddress inserts a new address (not default)', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([]) as any)
      .mockImplementationOnce(() => ({ insert: insertFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await result.current.addAddress.mutateAsync(makeAddress({ is_default: false, label: 'Work' }));
    expect(insertFn).toHaveBeenCalled();
  });

  it('addAddress clears existing default when is_default=true', async () => {
    const updateFn = vi.fn().mockReturnThis();
    const clearEqFn = vi.fn().mockResolvedValue({ error: null });
    const insertFn = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([]) as any)
      .mockImplementationOnce(() => ({ update: updateFn, eq: clearEqFn } as any))
      .mockImplementationOnce(() => ({ insert: insertFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await result.current.addAddress.mutateAsync(makeAddress({ is_default: true }));
    expect(updateFn).toHaveBeenCalledWith({ is_default: false });
  });

  it('deleteAddress removes an address', async () => {
    const deleteFn = vi.fn().mockReturnThis();
    const deleteEq2Fn = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({
        delete: deleteFn,
        eq: vi.fn().mockReturnValue({ eq: deleteEq2Fn }),
      } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.deleteAddress.mutateAsync('addr-1');
    expect(deleteFn).toHaveBeenCalled();
  });

  it('setDefault clears other defaults then sets the new one', async () => {
    const clearUpdateFn = vi.fn().mockReturnThis();
    const clearEqFn = vi.fn().mockResolvedValue({ error: null });
    const setUpdateFn = vi.fn().mockReturnThis();
    const setEqFn = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({ update: clearUpdateFn, eq: clearEqFn } as any))
      .mockImplementationOnce(() => ({ update: setUpdateFn, eq: setEqFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.setDefault.mutateAsync('addr-1');
    expect(clearUpdateFn).toHaveBeenCalledWith({ is_default: false });
    expect(setUpdateFn).toHaveBeenCalledWith({ is_default: true });
  });

  it('updateAddress updates address fields', async () => {
    const updateFn = vi.fn().mockReturnThis();
    const updateEq2Fn = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({
        update: updateFn,
        eq: vi.fn().mockReturnValue({ eq: updateEq2Fn }),
      } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.updateAddress.mutateAsync({ id: 'addr-1', city: 'Stockholm' });
    expect(updateFn).toHaveBeenCalled();
  });

  it('defaultAddress falls back to addresses[0] when none is_default (covers ?? addresses[0] branch)', async () => {
    const addresses = [
      makeAddress({ id: 'addr-1', is_default: false }),
      makeAddress({ id: 'addr-2', is_default: false }),
    ];
    vi.mocked(supabase.from).mockImplementationOnce(() => makeQueryChain(addresses) as any);

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultAddress?.id).toBe('addr-1');
  });

  it('defaultAddress is null when addresses is empty (covers ?? null branch)', () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    expect(result.current.defaultAddress).toBeNull();
  });

  it('addAddress returns early when user is null (covers !user branch)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await expect(result.current.addAddress.mutateAsync(makeAddress())).resolves.toBeUndefined();
  });

  it('addAddress uses "Home" when label is omitted (covers label ?? "Home" branch)', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([]) as any)
      .mockImplementationOnce(() => ({ insert: insertFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await result.current.addAddress.mutateAsync({ full_name: 'Jane', line1: '1 St', city: 'X', postal_code: '123', country: 'SE' });
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Home' }),
    );
  });

  it('addAddress defaults is_default to true when addresses is empty (covers ?? addresses.length===0 branch)', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([]) as any)
      .mockImplementationOnce(() => ({ insert: insertFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    // is_default not provided — should default to addresses.length === 0 = true
    await result.current.addAddress.mutateAsync({ full_name: 'Jane', line1: '1 St', city: 'X', postal_code: '123', country: 'SE' });
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ is_default: true }),
    );
  });

  it('addAddress throws when insert errors (covers error throw branch)', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: new Error('insert failed') });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([]) as any)
      .mockImplementationOnce(() => ({ insert: insertFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await expect(result.current.addAddress.mutateAsync(makeAddress({ is_default: false }))).rejects.toThrow('insert failed');
  });

  it('updateAddress returns early when user is null (covers !user branch)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await expect(result.current.updateAddress.mutateAsync({ id: 'addr-1' })).resolves.toBeUndefined();
  });

  it('updateAddress throws when update errors (covers error throw branch)', async () => {
    const updateFn = vi.fn().mockReturnThis();
    const eqFn = vi.fn().mockResolvedValue({ error: new Error('update failed') });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({
        update: updateFn,
        eq: vi.fn().mockReturnValue({ eq: eqFn }),
      } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(result.current.updateAddress.mutateAsync({ id: 'addr-1', city: 'Fail' })).rejects.toThrow('update failed');
  });

  it('deleteAddress returns early when user is null (covers !user branch)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await expect(result.current.deleteAddress.mutateAsync('addr-1')).resolves.toBeUndefined();
  });

  it('deleteAddress throws when delete errors (covers error throw branch)', async () => {
    const deleteEq2Fn = vi.fn().mockResolvedValue({ error: new Error('delete failed') });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({ eq: deleteEq2Fn }),
      } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(result.current.deleteAddress.mutateAsync('addr-1')).rejects.toThrow('delete failed');
  });

  it('setDefault returns early when user is null (covers !user branch)', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await expect(result.current.setDefault.mutateAsync('addr-1')).resolves.toBeUndefined();
  });

  it('setDefault throws when set update errors (covers error throw branch)', async () => {
    const clearEqFn = vi.fn().mockResolvedValue({ error: null });
    const setEqFn = vi.fn().mockResolvedValue({ error: new Error('set failed') });
    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({ update: vi.fn().mockReturnThis(), eq: clearEqFn } as any))
      .mockImplementationOnce(() => ({ update: vi.fn().mockReturnThis(), eq: setEqFn } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(result.current.setDefault.mutateAsync('addr-1')).rejects.toThrow('set failed');
  });

  it('updateAddress clears existing default when is_default=true (covers lines 56-57)', async () => {
    const clearUpdateFn = vi.fn().mockReturnThis();
    const clearEqFn = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnThis();
    const updateEq2Fn = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from)
      .mockImplementationOnce(() => makeQueryChain([makeAddress()]) as any)
      .mockImplementationOnce(() => ({ update: clearUpdateFn, eq: clearEqFn } as any))
      .mockImplementationOnce(() => ({
        update: updateFn,
        eq: vi.fn().mockReturnValue({ eq: updateEq2Fn }),
      } as any));

    const { result } = renderHook(() => useShippingAddresses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.updateAddress.mutateAsync({ id: 'addr-1', is_default: true });
    expect(clearUpdateFn).toHaveBeenCalledWith({ is_default: false });
    expect(updateFn).toHaveBeenCalled();
  });
});
