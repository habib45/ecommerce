import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

/**
 * Initialize cart on app load and sync with authentication state
 *
 * Handles:
 * - Loading guest cart from localStorage on first page load
 * - Loading user cart from Supabase when logged in
 * - Clearing cart when logged out
 * - Merging guest cart into user cart on login
 */
export function useInitCart() {
  const userId = useAuthStore((s) => s.user?.id);
  const { loadCart, mergeGuestCart } = useCartStore();

  useEffect(() => {
    if (userId) {
      // mergeGuestCart: clears localStorage, loads DB cart, then adds any
      // guest items that don't already exist in the DB cart.
      mergeGuestCart(userId);
    } else {
      loadCart();
    }
  // Depend on userId (string | undefined) — not the full user object.
  // This prevents re-running on token refresh when the user ID hasn't changed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
