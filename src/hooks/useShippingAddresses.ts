import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Address } from '@/types/domain';

export interface SavedAddress extends Partial<Address> {
  id: string;
  label: string;
  is_default: boolean;
}

export function useShippingAddresses() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const QK = ['shipping-addresses', user?.id];

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: QK,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as SavedAddress[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const addAddress = useMutation({
    mutationFn: async (addr: Partial<Address> & { label?: string; is_default?: boolean }) => {
      if (!user) return;
      // If marking as default, clear existing defaults first
      if (addr.is_default) {
        await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      const { error } = await supabase.from('shipping_addresses').insert({
        user_id: user.id,
        label: addr.label ?? 'Home',
        is_default: addr.is_default ?? addresses.length === 0,
        ...addr,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, ...addr }: Partial<Address> & { id: string; label?: string; is_default?: boolean }) => {
      if (!user) return;
      if (addr.is_default) {
        await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
      }
      const { error } = await supabase.from('shipping_addresses').update(addr).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from('shipping_addresses').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
      const { error } = await supabase.from('shipping_addresses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  return { addresses, isLoading, defaultAddress, addAddress, updateAddress, deleteAddress, setDefault };
}
