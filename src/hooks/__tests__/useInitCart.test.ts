import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInitCart } from '../useInitCart';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

// Use real Zustand stores so that the selector function `(s) => s.user?.id`
// in useInitCart actually executes (required for 100% function coverage).
// Only mock the side-effectful actions.
const mockLoadCart = vi.fn();
const mockMergeGuestCart = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Reset stores to default state
  useAuthStore.setState({
    user: null,
    session: null,
    profile: null,
    loading: false,
    initialized: true,
  } as any);
  useCartStore.setState({
    loadCart: mockLoadCart,
    mergeGuestCart: mockMergeGuestCart,
  } as any);
});

describe('useInitCart', () => {
  it('calls loadCart (no userId) when user is not authenticated', () => {
    useAuthStore.setState({ user: null } as any);
    renderHook(() => useInitCart());
    expect(mockLoadCart).toHaveBeenCalledWith();
    expect(mockMergeGuestCart).not.toHaveBeenCalled();
  });

  it('calls mergeGuestCart with userId when user is authenticated', () => {
    useAuthStore.setState({ user: { id: 'user-abc' } } as any);
    renderHook(() => useInitCart());
    expect(mockMergeGuestCart).toHaveBeenCalledWith('user-abc');
    expect(mockLoadCart).not.toHaveBeenCalled();
  });

  it('the userId selector returns undefined when user is null', () => {
    // Render with null user — loadCart should be called without args
    useAuthStore.setState({ user: null } as any);
    renderHook(() => useInitCart());
    expect(mockLoadCart).toHaveBeenCalled();
  });
});
