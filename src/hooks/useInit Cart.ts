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
  const { user } = useAuthStore();
  const { loadCart, mergeGuestCart } = useCartStore();

  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        // User is logged in: load their persistent cart
        await loadCart(user.id);
        // Merge any guest items before login
        await mergeGuestCart(user.id);
      } else {
        // User is guest: load from localStorage
        await loadCart();
      }
    };

    initializeCart();
  }, [user, loadCart, mergeGuestCart]);
}
