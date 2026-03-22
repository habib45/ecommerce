import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Address } from '@/types/domain';

export function useSavedAddress() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: savedAddress } = useQuery({
    queryKey: ['saved-address', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('default_shipping_address')
        .eq('id', user!.id)
        .single();
      return (data?.default_shipping_address ?? null) as Partial<Address> | null;
    },
  });

  const saveAddress = useMutation({
    mutationFn: async (address: Partial<Address>) => {
      if (!user) return;
      const { error } = await supabase
        .from('profiles')
        .update({ default_shipping_address: address })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-address', user?.id] });
    },
  });

  return { savedAddress, saveAddress };
}
