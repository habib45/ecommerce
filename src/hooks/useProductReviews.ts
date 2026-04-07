import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { ProductReview, ProductRatingSummary } from '@/types/domain';

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, user:profiles(full_name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        ...r,
        user_name: r.user?.full_name ?? 'Anonymous',
      })) as ProductReview[];
    },
    enabled: !!productId,
  });
}

export function useProductRatingSummary(productId: string) {
  return useQuery({
    queryKey: ['product-rating-summary', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_rating_summary')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data as ProductRatingSummary | null;
    },
    enabled: !!productId,
  });
}

export function useUserReview(productId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['user-review', productId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return data as ProductReview | null;
    },
    enabled: !!productId && !!userId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      rating: number;
      title: string;
      body: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('product_reviews')
        .upsert({ ...review, user_id: user.id }, { onConflict: 'product_id,user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as ProductReview;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product-rating-summary', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', data.product_id] });
    },
  });
}
