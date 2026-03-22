import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { CurrencyCode } from '@/types/domain';

export type DeliveryFees = Record<CurrencyCode, number>;

async function fetchDeliveryFee(): Promise<DeliveryFees> {
  const { data } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'delivery_fee')
    .single();
  return (data?.value ?? { USD: 500, BDT: 5000, SEK: 5000, EUR: 500 }) as DeliveryFees;
}

export function useDeliveryFee() {
  return useQuery({
    queryKey: ['store-settings', 'delivery_fee'],
    queryFn: fetchDeliveryFee,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateDeliveryFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fees: DeliveryFees) => {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key: 'delivery_fee', value: fees, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings', 'delivery_fee'] });
    },
  });
}
