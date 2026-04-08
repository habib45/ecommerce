import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { CurrencyCode, TranslationMap } from '@/types/domain';

export type DeliveryFees = Record<CurrencyCode, number>;
export type FreeShippingThreshold = Record<CurrencyCode, number>;

export interface AnnouncementBar {
  enabled: boolean;
  text: TranslationMap;
}

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

// ─── Free Shipping Threshold ────────────────────────────────────

const DEFAULT_FREE_SHIPPING: FreeShippingThreshold = { USD: 5000, BDT: 500000, SEK: 50000, EUR: 5000 };

async function fetchFreeShippingThreshold(): Promise<FreeShippingThreshold> {
  const { data } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'free_shipping_threshold')
    .single();
  return (data?.value ?? DEFAULT_FREE_SHIPPING) as FreeShippingThreshold;
}

export function useFreeShippingThreshold() {
  return useQuery({
    queryKey: ['store-settings', 'free_shipping_threshold'],
    queryFn: fetchFreeShippingThreshold,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateFreeShippingThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (thresholds: FreeShippingThreshold) => {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key: 'free_shipping_threshold', value: thresholds, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings', 'free_shipping_threshold'] });
    },
  });
}

// ─── Service Charge ────────────────────────────────────────────

/** Service charge stored as basis points (e.g. 500 = 5.00%) */
async function fetchServiceChargeRate(): Promise<number> {
  const { data } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'service_charge_rate')
    .single();
  return (data?.value as unknown as number) ?? 500;
}

export function useServiceChargeRate() {
  return useQuery({
    queryKey: ['store-settings', 'service_charge_rate'],
    queryFn: fetchServiceChargeRate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateServiceChargeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rateBps: number) => {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key: 'service_charge_rate', value: rateBps as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings', 'service_charge_rate'] });
    },
  });
}

// ─── Announcement Bar ──────────────────────────────────────────

const DEFAULT_ANNOUNCEMENT: AnnouncementBar = {
  enabled: true,
  text: {
    en: 'Free shipping on orders over $50 • 30-day returns',
    'bn-BD': '$50-এর বেশি অর্ডারে বিনামূল্যে শিপিং • 30 দিনের রিটার্ন',
    sv: 'Fri frakt på beställningar över 500 kr • 30 dagars retur',
  },
};

async function fetchAnnouncementBar(): Promise<AnnouncementBar> {
  const { data } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'announcement_bar')
    .single();
  return (data?.value ?? DEFAULT_ANNOUNCEMENT) as AnnouncementBar;
}

export function useAnnouncementBar() {
  return useQuery({
    queryKey: ['store-settings', 'announcement_bar'],
    queryFn: fetchAnnouncementBar,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAnnouncementBar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bar: AnnouncementBar) => {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ key: 'announcement_bar', value: bar as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings', 'announcement_bar'] });
    },
  });
}
